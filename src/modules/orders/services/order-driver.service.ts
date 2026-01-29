import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import {
    CommissionSource,
    DriverStatus,
    OrderStatus,
    PaymentMethod,
    User,
    UserRole,
} from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AnalyticsTrackingService } from '../../analytics/analytics-tracking.service';
import { DriversService } from '../../drivers/drivers.service';
import { CommissionService } from '../commission.service';
import { AssignDriverDto } from '../dto/assign-driver.dto';
import { DriverReportProblemDto } from '../dto/driver-report-problem.dto';
import { OrderManagementService } from '../order-management.service';
import {
    AnalyticsEventType,
    NotificationEventType,
    OrderConstants,
    ORDERS_ERRORS,
    ORDERS_NOTIFICATIONS,
} from '../orders.constants';
import { OrdersGateway } from '../orders.gateway';
import { mapOrderResponse, orderInclude } from '../orders.helper';
import { OrderDeliveryService } from './order-delivery.service';
import { OrderQueryService } from './order-query.service';

@Injectable()
export class OrderDriverService {
    constructor(
        private prisma: PrismaService,
        private managementService: OrderManagementService,
        private commissionService: CommissionService,
        private notificationService: NotificationService,
        private analyticsTrackingService: AnalyticsTrackingService,
        private ordersGateway: OrdersGateway,
        private i18n: I18nService,
        @Inject(forwardRef(() => OrderDeliveryService))
        private deliveryService: OrderDeliveryService,
        @Inject(forwardRef(() => OrderQueryService))
        private queryService: OrderQueryService,
        @Inject(forwardRef(() => DriversService))
        private driversService: DriversService,
    ) { }

    async reportDeliveryProblem(
        id: string,
        dto: DriverReportProblemDto,
        user: User,
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { vendor: true },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (order.driverId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.NOT_ASSIGNED_TO_THIS_ORDER);
        }

        const validStatuses: OrderStatus[] = [
            OrderStatus.DRIVER_ACCEPTED,
            OrderStatus.SHIPPED,
            OrderStatus.IN_TRANSIT,
        ];

        if (!validStatuses.includes(order.status)) {
            throw new BadRequestException(
                ORDERS_ERRORS.CANNOT_REPORT_PROBLEM_IN_CURRENT_STATUS,
            );
        }

        const savedOrder = await this.deliveryService.processOrderCancellation(
            id,
            user,
            `Delivery reported problem: ${dto.reason}`,
            AnalyticsEventType.DELIVERY_FAILED,
        );

        if (!savedOrder) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        await this.notificationService.sendOrderNotification(
            savedOrder.authorId,
            ORDERS_NOTIFICATIONS.ORDER_FAILED_DELIVERY,
            { orderId: savedOrder.id, reason: dto.reason },
        );

        await this.notificationService.sendOrderNotification(
            order.vendor.authorId,
            ORDERS_NOTIFICATIONS.ORDER_FAILED_DELIVERY_VENDOR,
            { orderId: savedOrder.id, reason: dto.reason },
        );

        if (order.vendor.zoneId) {
            const managers = await this.prisma.user.findMany({
                where: { role: UserRole.MANAGER, zoneId: order.vendor.zoneId },
            });

            for (const manager of managers) {
                const titleEn = await this.i18n.translate(
                    'messages.DELIVERY_ISSUE_TITLE',
                    { lang: 'en' },
                );
                const titleAr = await this.i18n.translate(
                    'messages.DELIVERY_ISSUE_TITLE',
                    { lang: 'ar' },
                );
                const bodyEn = await this.i18n.translate(
                    'messages.DELIVERY_ISSUE_BODY',
                    {
                        lang: 'en',
                        args: { orderId: savedOrder.id, reason: dto.reason },
                    },
                );
                const bodyAr = await this.i18n.translate(
                    'messages.DELIVERY_ISSUE_BODY',
                    {
                        lang: 'ar',
                        args: { orderId: savedOrder.id, reason: dto.reason },
                    },
                );

                await this.notificationService.sendCustomNotification(
                    [manager.id],
                    { en: titleEn, ar: titleAr },
                    { en: bodyEn, ar: bodyAr },
                    {
                        orderId: savedOrder.id,
                        type: NotificationEventType.DELIVERY_ISSUE,
                    },
                );
            }
        }

        return this.emitUpdate(savedOrder);
    }

    async assignDriver(id: string, assignDriverDto: AssignDriverDto, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { vendor: true },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        const invalidStatuses: OrderStatus[] = [
            OrderStatus.COMPLETED,
            OrderStatus.CANCELLED,
        ];

        if (invalidStatuses.includes(order.status)) {
            throw new BadRequestException(
                ORDERS_ERRORS.CANNOT_ASSIGN_DRIVER_TO_CLOSED_ORDER,
            );
        }

        if (user.role === UserRole.VENDOR && order.vendor?.authorId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        if (user.role === UserRole.MANAGER) {
            const managerZoneId =
                await this.managementService.validateManagerZoneAccess(
                    user.id,
                    order.vendor.zoneId,
                );

            const driver = await this.prisma.user.findUnique({
                where: { id: assignDriverDto.driverId },
                select: {
                    zoneId: true,
                    role: true,
                    driverProfile: {
                        select: {
                            walletAmount: true,
                            status: true,
                            isOnline: true,
                        },
                    },
                },
            });

            if (!driver || driver.role !== UserRole.DRIVER) {
                throw new NotFoundException(ORDERS_ERRORS.DRIVER_NOT_FOUND);
            }

            if (!driver.driverProfile) {
                throw new BadRequestException(
                    ORDERS_ERRORS.DRIVER_PROFILE_NOT_INITIALIZED,
                );
            }

            if (!driver.driverProfile.isOnline) {
                throw new BadRequestException(ORDERS_ERRORS.DRIVER_OFFLINE);
            }

            if (driver.driverProfile.status === DriverStatus.BUSY) {
                throw new BadRequestException(ORDERS_ERRORS.DRIVER_BUSY);
            }

            if (driver.zoneId !== managerZoneId) {
                throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
            }

            const maxDebt = await this.commissionService.getMaxDriverDebt();
            const currentBalance = Number(driver.driverProfile.walletAmount || 0);
            const currentDebt = currentBalance < 0 ? Math.abs(currentBalance) : 0;

            let expectedNewDebt = 0;
            if (order.paymentMethod === PaymentMethod.cash) {
                expectedNewDebt = Number(order.totalAmount) - Number(order.tipAmount);
            }

            if (currentDebt + expectedNewDebt > maxDebt) {
                throw new BadRequestException(ORDERS_ERRORS.DRIVER_MAX_DEBT_EXCEEDED);
            }

            await this.prisma.managerAuditLog.create({
                data: {
                    managerId: user.id,
                    orderId: id,
                    driverId: assignDriverDto.driverId,
                    action: OrderConstants.MANAGER_AUDIT_ACTION_DISPATCH,
                },
            });
        }

        const savedOrder = await this.prisma.$transaction(async (tx) => {
            // Atomic update to mark driver as BUSY only if they are not already BUSY
            const updateResult = await tx.driverProfile.updateMany({
                where: {
                    userId: assignDriverDto.driverId,
                    status: { not: DriverStatus.BUSY },
                },
                data: { status: DriverStatus.BUSY },
            });

            // If no record was updated, it means the driver was already BUSY
            if (updateResult.count === 0) {
                throw new ConflictException(ORDERS_ERRORS.DRIVER_BUSY);
            }

            return tx.order.update({
                where: { id },
                data: {
                    driverId: assignDriverDto.driverId,
                    status: OrderStatus.DRIVER_PENDING,
                    managerId: user.role === UserRole.MANAGER ? user.id : undefined,
                },
                include: orderInclude,
            });
        });

        this.analyticsTrackingService.trackOrderLifecycle({
            orderId: savedOrder.id,
            eventType: AnalyticsEventType.DRIVER_ASSIGNED,
            previousStatus: order.status,
            newStatus: OrderStatus.DRIVER_PENDING,
            actorId: user.id,
            actorRole: user.role,
            metadata: {
                driverId: assignDriverDto.driverId,
            },
        });

        await this.notificationService.sendOrderNotification(
            assignDriverDto.driverId,
            ORDERS_NOTIFICATIONS.ORDER_DRIVER_PENDING,
            {
                orderId: savedOrder.id,
                status: savedOrder.status,
                type: 'order',
            },
        );

        return this.emitUpdate(savedOrder);
    }

    async rejectOrder(id: string, user: User) {
        const order = await this.queryService.findOne(id, user);
        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (order.driverId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.DRIVER_NOT_ASSIGNED);
        }

        const savedOrder = await this.prisma.$transaction(async (tx) => {
            await tx.driverProfile.update({
                where: { userId: user.id },
                data: { status: DriverStatus.AVAILABLE },
            });

            return tx.order.update({
                where: { id },
                data: {
                    driverId: null,
                    status: OrderStatus.DRIVER_REJECTED,
                },
                include: { ...orderInclude, vendor: true },
            });
        });

        this.analyticsTrackingService.trackOrderLifecycle({
            orderId: savedOrder.id,
            eventType: AnalyticsEventType.DRIVER_REJECTED,
            previousStatus: order.status,
            newStatus: OrderStatus.DRIVER_REJECTED,
            actorId: user.id,
            actorRole: user.role,
        });

        if (savedOrder.vendor?.zoneId) {
            const managers = await this.prisma.user.findMany({
                where: {
                    role: UserRole.MANAGER,
                    zoneId: savedOrder.vendor.zoneId,
                    isActive: true,
                    fcmToken: { not: null },
                },
                select: { id: true },
            });

            const managerIds = managers.map((m) => m.id);
            if (managerIds.length > 0) {
                await this.notificationService.sendBulkNotifications(
                    managerIds,
                    ORDERS_NOTIFICATIONS.MANAGER_DRIVER_REJECTED,
                    {
                        orderId: savedOrder.id,
                        vendorName: savedOrder.vendor.title,
                        driverName: `${user.firstName} ${user.lastName}`,
                        status: 'DRIVER_REJECTED',
                    },
                );
            }
        }

        return this.emitUpdate(savedOrder);
    }

    async acceptOrder(id: string, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (order.driverId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.DRIVER_NOT_ASSIGNED);
        }

        if (order.status !== OrderStatus.DRIVER_PENDING) {
            throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_PENDING);
        }

        const savedOrder = await this.prisma.order.update({
            where: { id },
            data: { status: OrderStatus.DRIVER_ACCEPTED },
            include: { ...orderInclude, vendor: true },
        });

        if (savedOrder.vendor?.zoneId) {
            const managers = await this.prisma.user.findMany({
                where: {
                    role: UserRole.MANAGER,
                    zoneId: savedOrder.vendor.zoneId,
                    isActive: true,
                    fcmToken: { not: null },
                },
                select: { id: true },
            });

            const managerIds = managers.map((m) => m.id);
            if (managerIds.length > 0) {
                await this.notificationService.sendBulkNotifications(
                    managerIds,
                    ORDERS_NOTIFICATIONS.MANAGER_DRIVER_ACCEPTED,
                    {
                        orderId: savedOrder.id,
                        vendorName: savedOrder.vendor.title,
                        driverName: `${user.firstName} ${user.lastName}`,
                        status: 'DRIVER_ACCEPTED',
                    },
                );
            }
        }

        return this.emitUpdate(savedOrder);
    }

    async confirmPickup(id: string, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { vendor: true },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (order.driverId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.DRIVER_NOT_ASSIGNED);
        }

        if (order.status !== OrderStatus.DRIVER_ACCEPTED) {
            throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_ACCEPTED_BY_DRIVER);
        }

        if (order.estimatedReadyAt && new Date() < order.estimatedReadyAt) {
            throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_READY_YET);
        }

        return await this.prisma.$transaction(async (tx) => {
            const driverCommRate =
                await this.commissionService.getDriverCommissionRate();
            const minPay = await this.commissionService.getMinDeliveryPay();

            const deliveryCharge = Number(order.deliveryCharge);
            const adminDeliveryCut =
                Math.round(deliveryCharge * (driverCommRate / 100) * 100) / 100;

            const driverNet = Math.max(
                Math.min(deliveryCharge, deliveryCharge - adminDeliveryCut),
                minPay,
            );

            const driverCommissionValue = Math.max(0, deliveryCharge - driverNet);

            await this.commissionService.createCommissionSnapshot(
                {
                    orderId: id,
                    driverId: order.driverId ?? undefined,
                    source: CommissionSource.DRIVER,
                    commissionRate: driverCommRate,
                    commissionValue: driverCommissionValue,
                    baseAmount: deliveryCharge,
                },
                tx,
            );

            const platformTotal =
                Number(order.vendorCommissionValue) + driverCommissionValue;

            const deliveryOtp = Math.floor(
                100000 + Math.random() * 900000,
            ).toString();

            const savedOrder = await tx.order.update({
                where: { id },
                data: {
                    status: OrderStatus.SHIPPED,
                    driverCommissionApplied: true,
                    driverCommissionRate: driverCommRate,
                    driverCommissionValue,
                    driverNet,
                    platformTotalCommission: platformTotal,
                    deliveryOtp,
                },
                include: orderInclude,
            });

            if (order.paymentMethod === PaymentMethod.wallet) {
                const driverTotal =
                    Number(savedOrder.driverNet) + Number(savedOrder.tipAmount);
                await tx.heldBalance.update({
                    where: { orderId: order.id },
                    data: {
                        driverId: order.driverId,
                        vendorAmount: Number(savedOrder.vendorNet),
                        driverAmount: driverTotal,
                        adminAmount: platformTotal,
                        autoReleaseDate: (() => {
                            const date = new Date();
                            date.setDate(date.getDate() + 7);
                            return date;
                        })(),
                    },
                });
            }

            this.analyticsTrackingService.trackOrderLifecycle({
                orderId: savedOrder.id,
                eventType: AnalyticsEventType.ORDER_PICKED_UP,
                previousStatus: OrderStatus.DRIVER_ACCEPTED,
                newStatus: OrderStatus.SHIPPED,
                actorId: user.id,
                actorRole: UserRole.DRIVER,
                metadata: {
                    driverId: user.id,
                    vendorId: order.vendorId,
                    pickupTime: new Date(),
                },
            });

            await this.notificationService.sendOrderNotification(
                order.authorId,
                ORDERS_NOTIFICATIONS.ORDER_SHIPPED,
                {
                    orderId: savedOrder.id,
                    vendorName: order.vendor.title,
                    status: savedOrder.status,
                },
            );

            return this.emitUpdate(savedOrder);
        });
    }

    async startTransit(id: string, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { vendor: true },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (order.driverId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.DRIVER_NOT_ASSIGNED);
        }

        if (order.status !== OrderStatus.SHIPPED) {
            throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_SHIPPED);
        }

        const savedOrder = await this.prisma.order.update({
            where: { id },
            data: { status: OrderStatus.IN_TRANSIT },
            include: orderInclude,
        });

        this.analyticsTrackingService.trackOrderLifecycle({
            orderId: savedOrder.id,
            eventType: AnalyticsEventType.ORDER_IN_TRANSIT,
            previousStatus: OrderStatus.SHIPPED,
            newStatus: OrderStatus.IN_TRANSIT,
            actorId: user.id,
            actorRole: UserRole.DRIVER,
            metadata: {
                driverId: user.id,
                vendorId: order.vendorId,
                transitStartTime: new Date(),
            },
        });

        await this.notificationService.sendOrderNotification(
            order.authorId,
            ORDERS_NOTIFICATIONS.ORDER_IN_TRANSIT,
            {
                orderId: savedOrder.id,
                vendorName: order.vendor.title,
                status: savedOrder.status,
            },
        );

        return this.emitUpdate(savedOrder);
    }

    private emitUpdate(order: any) {
        const mappedOrder = mapOrderResponse(order);
        if (mappedOrder) {
            const zoneId = order.vendor?.zoneId;
            this.ordersGateway.emitOrderUpdate(mappedOrder, zoneId);
        }
        return mappedOrder;
    }
}
