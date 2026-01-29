import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    CommissionSource,
    OrderStatus,
    Prisma,
    User,
    UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AnalyticsTrackingService } from '../../analytics/analytics-tracking.service';
import { CommissionService } from '../commission.service';
import { VendorAcceptOrderDto } from '../dto/vendor-accept-order.dto';
import {
    AnalyticsEventType,
    ORDERS_ERRORS,
    ORDERS_NOTIFICATIONS,
} from '../orders.constants';
import { OrdersGateway } from '../orders.gateway';
import { mapOrderResponse, orderInclude } from '../orders.helper';

@Injectable()
export class OrderVendorService {
    constructor(
        private prisma: PrismaService,
        private commissionService: CommissionService,
        private notificationService: NotificationService,
        private analyticsTrackingService: AnalyticsTrackingService,
        private ordersGateway: OrdersGateway,
    ) { }

    async vendorRejectOrder(id: string, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { vendor: true },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (user.role === UserRole.VENDOR && order.vendor.authorId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        if (order.status !== OrderStatus.PLACED) {
            throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_PLACED);
        }

        const savedOrder = await this.prisma.order.update({
            where: { id },
            data: { status: OrderStatus.VENDOR_REJECTED },
            include: orderInclude,
        });

        this.analyticsTrackingService.trackOrderLifecycle({
            orderId: savedOrder.id,
            eventType: AnalyticsEventType.VENDOR_REJECTED,
            previousStatus: OrderStatus.PLACED,
            newStatus: OrderStatus.VENDOR_REJECTED,
            actorId: user.id,
            actorRole: user.role,
        });

        await this.notificationService.sendOrderNotification(
            order.authorId,
            ORDERS_NOTIFICATIONS.ORDER_REJECTED,
            { orderId: savedOrder.id, status: savedOrder.status },
        );

        return this.emitUpdate(savedOrder);
    }

    async vendorAcceptOrder(id: string, user: User, dto?: VendorAcceptOrderDto) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { vendor: { include: { subscriptionPlan: true } } },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (user.role === UserRole.VENDOR && order.vendor.authorId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        const plan = order.vendor.subscriptionPlan;
        if (plan && Number(plan.price) !== 0 && plan.totalOrders !== -1) {
            const remainingOrders = order.vendor.subscriptionTotalOrders ?? 0;
            if (remainingOrders <= 0) {
                throw new BadRequestException(
                    ORDERS_ERRORS.SUBSCRIPTION_ORDER_LIMIT_REACHED,
                );
            }
        }

        return await this.prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({
                where: { id },
                select: { status: true, vendorCommissionApplied: true },
            });

            if (!currentOrder)
                throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);
            if (currentOrder.status !== OrderStatus.PLACED)
                throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_PLACED);
            if (currentOrder.vendorCommissionApplied)
                throw new BadRequestException(ORDERS_ERRORS.COMMISSION_ALREADY_APPLIED);

            if (plan && Number(plan.price) !== 0 && plan.totalOrders !== -1) {
                await tx.vendor.update({
                    where: { id: order.vendorId },
                    data: { subscriptionTotalOrders: { decrement: 1 } },
                });
            }

            const isFreePlan = await this.commissionService.isVendorOnFreePlan(
                order.vendorId,
            );

            let vendorCommissionRate = 0;
            let vendorCommissionValue = 0;

            const vendorBaseAmount = Number(order.orderSubtotal) - Number(order.discountAmount);
            let vendorNet = Math.max(0, vendorBaseAmount);

            if (isFreePlan) {
                vendorCommissionRate =
                    await this.commissionService.getVendorCommissionRate();
                const calculation = this.commissionService.calculateVendorCommission(
                    vendorBaseAmount,
                    vendorCommissionRate,
                );
                vendorCommissionValue = calculation.value;
                vendorNet = Math.max(0, vendorBaseAmount - vendorCommissionValue);

                await this.commissionService.createCommissionSnapshot(
                    {
                        orderId: id,
                        vendorId: order.vendorId,
                        source: CommissionSource.VENDOR,
                        commissionRate: vendorCommissionRate,
                        commissionValue: vendorCommissionValue,
                        baseAmount: vendorBaseAmount,
                    },
                    tx,
                );
            }

            let estimatedReadyAt: Date | undefined;
            if (dto?.preparationTime) {
                const now = new Date();
                estimatedReadyAt = new Date(
                    now.getTime() + dto.preparationTime * 60000,
                );
            }

            const updateData: Prisma.OrderUpdateInput = {
                status: OrderStatus.VENDOR_ACCEPTED,
                vendorCommissionApplied: true,
                vendorCommissionRate,
                vendorCommissionValue,
                vendorNet,
                estimatedReadyAt,
                isReadyNotificationSent: false,
            };

            if (order.driverCommissionApplied) {
                const platformTotal =
                    vendorCommissionValue + Number(order.driverCommissionValue);
                updateData.platformTotalCommission = platformTotal;
            }

            const savedOrder = await tx.order.update({
                where: { id },
                data: updateData,
                include: orderInclude,
            });

            this.analyticsTrackingService.trackOrderLifecycle({
                orderId: savedOrder.id,
                eventType: AnalyticsEventType.VENDOR_ACCEPTED,
                previousStatus: OrderStatus.PLACED,
                newStatus: OrderStatus.VENDOR_ACCEPTED,
                actorId: user.id,
                actorRole: user.role,
                metadata: {
                    preparationTime: dto?.preparationTime,
                    estimatedReadyAt: estimatedReadyAt,
                },
            });

            await this.notificationService.sendOrderNotification(
                order.authorId,
                ORDERS_NOTIFICATIONS.ORDER_ACCEPTED,
                { orderId: savedOrder.id, status: savedOrder.status },
            );

            return this.emitUpdate(savedOrder);
        });
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
