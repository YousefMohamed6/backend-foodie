import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    TransactionType,
    User,
    UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AnalyticsTrackingService } from '../../analytics/analytics-tracking.service';
import { WalletTransactionDescriptions } from '../../wallet/wallet-transaction.constants';
import { WalletService } from '../../wallet/wallet.service';
import { MarkOrderDeliveredDto } from '../dto/mark-order-delivered.dto';
import {
    AnalyticsEventType,
    OrderConstants,
    ORDERS_ERRORS,
    ORDERS_NOTIFICATIONS,
} from '../orders.constants';
import { OrdersGateway } from '../orders.gateway';
import { mapOrderResponse, orderInclude } from '../orders.helper';
import { OrderQueryService } from './order-query.service';

@Injectable()
export class OrderDeliveryService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private notificationService: NotificationService,
        private analyticsTrackingService: AnalyticsTrackingService,
        private ordersGateway: OrdersGateway,
        @Inject(forwardRef(() => OrderQueryService))
        private queryService: OrderQueryService,
    ) { }

    async cancelOrder(id: string, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { vendor: true },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        // Validate ownership through query service
        await this.queryService.findOne(id, user);

        const invalidStatuses: OrderStatus[] = [
            OrderStatus.COMPLETED,
            OrderStatus.SHIPPED,
            OrderStatus.IN_TRANSIT,
            OrderStatus.CANCELLED,
        ];

        if (invalidStatuses.includes(order.status)) {
            throw new BadRequestException(ORDERS_ERRORS.ORDER_CANNOT_BE_CANCELLED);
        }

        const savedOrder = await this.processOrderCancellation(
            id,
            user,
            WalletTransactionDescriptions.orderCancelledByUser().en,
        );

        await this.notificationService.sendOrderNotification(
            savedOrder.authorId,
            ORDERS_NOTIFICATIONS.ORDER_CANCELLED,
            { orderId: savedOrder.id, status: savedOrder.status },
        );

        return this.emitUpdate(savedOrder);
    }

    async markOrderDelivered(
        id: string,
        user: User,
        dto?: MarkOrderDeliveredDto,
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { vendor: true },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (user.role === UserRole.DRIVER && order.driverId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        if (order.paymentMethod === PaymentMethod.wallet) {
            if (!dto?.otp) {
                throw new BadRequestException(ORDERS_ERRORS.OTP_REQUIRED);
            }
            if (order.deliveryOtp !== dto.otp) {
                const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                await this.prisma.order.update({
                    where: { id },
                    data: { deliveryOtp: newOtp },
                });
                throw new BadRequestException(ORDERS_ERRORS.INVALID_DELIVERY_OTP);
            }
        }

        return await this.prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({
                where: { id },
                select: {
                    status: true,
                    driverCommissionApplied: true,
                    totalAmount: true,
                    paymentMethod: true,
                    driverId: true,
                },
            });

            if (!currentOrder)
                throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

            const validStatuses: OrderStatus[] = [
                OrderStatus.DRIVER_ACCEPTED,
                OrderStatus.SHIPPED,
                OrderStatus.IN_TRANSIT,
            ];
            if (!validStatuses.includes(currentOrder.status)) {
                throw new BadRequestException(ORDERS_ERRORS.INVALID_ORDER_STATUS);
            }

            const savedOrder = await tx.order.update({
                where: { id },
                data: {
                    status: OrderStatus.COMPLETED,
                },
                include: orderInclude,
            });

            if (currentOrder.paymentMethod === PaymentMethod.cash) {
                await this.walletService.addVendorEarnings(
                    order.vendorId,
                    order.vendor.authorId,
                    Number(savedOrder.vendorNet),
                    savedOrder.id,
                    tx,
                );

                await this.walletService.addDriverEarnings(
                    currentOrder.driverId!,
                    Number(savedOrder.driverNet),
                    savedOrder.id,
                    tx,
                );

                await this.walletService.addAdminCommission(
                    Number(savedOrder.platformTotalCommission),
                    savedOrder.id,
                    tx,
                );

                const amountToCollect =
                    Number(order.totalAmount) - Number(order.tipAmount);
                await tx.walletTransaction.create({
                    data: {
                        userId: currentOrder.driverId!,
                        amount: amountToCollect,
                        type: TransactionType.PAYMENT,
                        descriptionEn: WalletTransactionDescriptions.cashCollectedDebt(
                            savedOrder.id,
                        ).en,
                        descriptionAr: WalletTransactionDescriptions.cashCollectedDebt(
                            savedOrder.id,
                        ).ar,
                        orderId: savedOrder.id,
                        transactionUser: OrderConstants.DRIVER_TRANSACTION_USER,
                    },
                });
                await this.walletService.updateDriverWallet(
                    currentOrder.driverId!,
                    amountToCollect,
                    OrderConstants.WALLET_OPERATION_SUBTRACT,
                    tx,
                );
            }

            if (currentOrder.paymentMethod === PaymentMethod.wallet) {
                await this.notificationService.sendOrderNotification(
                    order.authorId,
                    ORDERS_NOTIFICATIONS.CONFIRM_DELIVERY,
                    {
                        orderId: savedOrder.id,
                        status: savedOrder.status,
                        message: WalletTransactionDescriptions.deliveryConfirmedReason().en,
                    },
                );
            } else {
                await this.notificationService.sendOrderNotification(
                    order.authorId,
                    ORDERS_NOTIFICATIONS.ORDER_COMPLETED,
                    { orderId: savedOrder.id, status: savedOrder.status },
                );
            }

            this.analyticsTrackingService.trackOrderLifecycle({
                orderId: savedOrder.id,
                eventType: AnalyticsEventType.ORDER_DELIVERED,
                previousStatus: order.status,
                newStatus: OrderStatus.COMPLETED,
                actorId: user.id,
                actorRole: user.role,
                metadata: {
                    driverCommission: savedOrder.driverCommissionValue,
                    deliveryTime: new Date().getTime() - order.createdAt.getTime(),
                },
            });

            this.analyticsTrackingService.trackDeliveryEvent({
                orderId: savedOrder.id,
                driverId: user.id,
                vendorId: order.vendorId,
                eventType: 'DELIVERED',
                status: 'COMPLETED',
                latitude: 0,
                longitude: 0,
            });

            return this.emitUpdate(savedOrder);
        });
    }

    async processOrderCancellation(
        orderId: string,
        actor: User,
        reason: string,
        eventType:
            | AnalyticsEventType.ORDER_CANCELLED
            | AnalyticsEventType.DELIVERY_FAILED = AnalyticsEventType.ORDER_CANCELLED,
    ) {
        return await this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { vendor: true },
            });

            if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

            const previousStatus = order.status;

            const savedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.CANCELLED,
                    adminCommissionAmount: 0,
                    adminCommissionPercentage: 0,
                    driverCommissionValue: 0,
                    driverCommissionRate: 0,
                    vendorCommissionValue: 0,
                    vendorNet: 0,
                    vendorCommissionApplied: false,
                    driverCommissionApplied: false,
                    platformTotalCommission: 0,
                },
                include: orderInclude,
            });

            if (order.paymentMethod === PaymentMethod.wallet) {
                if (order.paymentStatus === PaymentStatus.PAID) {
                    await this.walletService.refund(
                        order.authorId,
                        Number(order.orderTotal),
                        WalletTransactionDescriptions.orderRefund(order.id, reason).en,
                        WalletTransactionDescriptions.orderRefund(order.id, reason).ar,
                        order.id,
                        tx,
                    );

                    await tx.order.update({
                        where: { id: orderId },
                        data: { paymentStatus: PaymentStatus.UNPAID },
                    });
                }

                const wasShipped =
                    order.status === OrderStatus.SHIPPED ||
                    order.status === OrderStatus.IN_TRANSIT ||
                    order.status === OrderStatus.DRIVER_ACCEPTED;

                if (wasShipped) {
                    if (Number(order.vendorNet) > 0) {
                        await this.walletService.updateVendorWallet(
                            order.vendorId,
                            Number(order.vendorNet),
                            OrderConstants.WALLET_OPERATION_SUBTRACT,
                            tx,
                        );
                    }

                    if (order.driverId && order.driverCommissionApplied) {
                        const driverTotal =
                            Number(order.driverNet) + Number(order.tipAmount);
                        if (driverTotal > 0) {
                            await this.walletService.updateDriverWallet(
                                order.driverId,
                                driverTotal,
                                OrderConstants.WALLET_OPERATION_SUBTRACT,
                                tx,
                            );
                        }
                    }

                    if (Number(order.platformTotalCommission) > 0) {
                        await this.walletService.updateAdminWallet(
                            Number(order.platformTotalCommission),
                            OrderConstants.WALLET_OPERATION_SUBTRACT,
                            tx,
                        );
                    }
                }
            }

            this.analyticsTrackingService.trackOrderLifecycle({
                orderId: savedOrder.id,
                eventType,
                previousStatus: previousStatus,
                newStatus: OrderStatus.CANCELLED,
                actorId: actor.id,
                actorRole: actor.role,
                metadata: { reason },
            });

            return savedOrder;
        });
    }

    emitUpdate(order: any) {
        const mappedOrder = mapOrderResponse(order);
        if (mappedOrder) {
            const zoneId = order.vendor?.zoneId;
            this.ordersGateway.emitOrderUpdate(mappedOrder, zoneId);
        }
        return mappedOrder;
    }
}
