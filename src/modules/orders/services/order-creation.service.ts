import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import {
    BalanceType,
    HeldBalanceStatus,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    TransactionType,
    User,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../../shared/services/mail.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AnalyticsTrackingService } from '../../analytics/analytics-tracking.service';
import { CashbackService } from '../../cashback/cashback.service';
import { APP_SETTINGS } from '../../settings/settings.constants';
import { SettingsService } from '../../settings/settings.service';
import { WalletTransactionDescriptions } from '../../wallet/wallet-transaction.constants';
import { WalletService } from '../../wallet/wallet.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderPricingService } from '../order-pricing.service';
import {
    AnalyticsEventType,
    OrderConstants,
    ORDERS_ERRORS,
    ORDERS_NOTIFICATIONS,
} from '../orders.constants';
import { OrdersGateway } from '../orders.gateway';
import { calculateSubtotal, mapOrderResponse, orderInclude } from '../orders.helper';

@Injectable()
export class OrderCreationService {
    private readonly logger = new Logger(OrderCreationService.name);

    constructor(
        private prisma: PrismaService,
        private pricingService: OrderPricingService,
        private cashbackService: CashbackService,
        private walletService: WalletService,
        private settingsService: SettingsService,
        private notificationService: NotificationService,
        private analyticsTrackingService: AnalyticsTrackingService,
        private mailService: MailService,
        private ordersGateway: OrdersGateway,
    ) { }

    async create(createOrderDto: CreateOrderDto, user: User) {
        const { productMap, subtotal } =
            await this.resolveProductsAndSubtotal(createOrderDto);

        const calculations = await this.pricingService.calculatePricing(
            createOrderDto,
            subtotal,
            user.id,
        );

        const result = await this.finalizeOrderCreate(
            createOrderDto,
            user,
            productMap,
            subtotal,
            calculations,
        );

        if (result) {
            this.analyticsTrackingService.trackOrderLifecycle({
                orderId: result.id,
                eventType: AnalyticsEventType.ORDER_CREATED,
                previousStatus: undefined,
                newStatus: OrderStatus.PLACED,
                actorId: user.id,
                actorRole: user.role,
                metadata: {
                    totalAmount: Number(result.orderTotal),
                    vendorId: result.vendorId,
                    itemsCount: result.products?.length || 0,
                },
            });

            this.mailService
                .sendOrderEmail(result.id)
                .catch((err) => this.logger.error('Failed to send order email', err));
        }

        return result;
    }

    private async resolveProductsAndSubtotal(createOrderDto: CreateOrderDto) {
        const productIds = createOrderDto.products.map((item) => item.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        const subtotal = calculateSubtotal(createOrderDto.products, productMap);
        return { productMap, subtotal };
    }

    private async finalizeOrderCreate(
        createOrderDto: CreateOrderDto,
        user: User,
        productMap: Map<string, any>,
        subtotal: number,
        calcs: any,
    ) {
        return await this.prisma.$transaction(async (tx) => {
            if (createOrderDto.cashbackId) {
                await this.cashbackService.findOne(createOrderDto.cashbackId);
            }

            // Validate stock availability for products with limited quantity (quantity != -1)
            for (const item of createOrderDto.products) {
                const product = productMap.get(item.productId);
                if (!product) {
                    throw new NotFoundException(ORDERS_ERRORS.PRODUCT_NOT_FOUND);
                }
                // quantity -1 means unlimited stock, skip validation
                if (product.quantity !== -1 && product.quantity < item.quantity) {
                    throw new BadRequestException(ORDERS_ERRORS.INSUFFICIENT_STOCK);
                }
            }

            const savedOrder = await tx.order.create({
                data: {
                    vendorId: createOrderDto.vendorId,
                    authorId: user.id,
                    items: {
                        create: createOrderDto.products.map((item) => {
                            const product = productMap.get(item.productId);
                            if (!product)
                                throw new NotFoundException(ORDERS_ERRORS.PRODUCT_NOT_FOUND);
                            const price = product.discountPrice
                                ? Number(product.discountPrice)
                                : Number(product.price);
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                price,
                                extras: {
                                    create: item.extras?.map((extra) => ({
                                        name: extra.name,
                                        price: extra.price,
                                    })),
                                },
                            };
                        }),
                    },
                    totalAmount: calcs.totalAmount,
                    status: OrderStatus.PLACED,
                    addressId: calcs.address.id,
                    paymentMethod: createOrderDto.paymentMethod,
                    driverId: null,
                    notes: createOrderDto.notes,
                    deliveryCharge: calcs.deliveryCharge,
                    tipAmount: createOrderDto.tipAmount,
                    takeAway: createOrderDto.takeAway || false,
                    scheduleTime: createOrderDto.scheduleTime
                        ? new Date(createOrderDto.scheduleTime)
                        : null,
                    orderSubtotal: subtotal,
                    orderTotal: calcs.totalAmount,
                    discountAmount: calcs.discountAmount,
                    distanceInKm: calcs.distance,
                    deliveryPricePerKm: 0,
                    adminCommissionPercentage: calcs.adminCommissionPercentage,
                    adminCommissionAmount: calcs.adminCommissionAmount,
                    vendorEarnings: calcs.vendorEarnings,
                    specialDiscountId: calcs.specialDiscountId,
                },
                include: orderInclude,
            });

            // Decrement product quantities for products with limited stock (quantity != -1)
            for (const item of createOrderDto.products) {
                const product = productMap.get(item.productId);
                if (product && product.quantity !== -1) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { quantity: { decrement: item.quantity } },
                    });
                }
            }

            if (createOrderDto.paymentMethod === PaymentMethod.wallet) {
                await tx.walletTransaction.create({
                    data: {
                        userId: user.id,
                        amount: calcs.totalAmount,
                        type: TransactionType.PAYMENT,
                        descriptionEn: WalletTransactionDescriptions.orderPaymentHeld(
                            savedOrder.id,
                        ).en,
                        descriptionAr: WalletTransactionDescriptions.orderPaymentHeld(
                            savedOrder.id,
                        ).ar,
                        orderId: savedOrder.id,
                        transactionUser: OrderConstants.CUSTOMER_TRANSACTION_USER,
                        balanceType: BalanceType.HELD,
                    },
                });

                await this.walletService.updateUserWallet(
                    user.id,
                    calcs.totalAmount,
                    OrderConstants.WALLET_OPERATION_SUBTRACT,
                    tx,
                );

                const autoReleaseDays = await this.settingsService
                    .findOne(APP_SETTINGS.WALLET_AUTO_RELEASE_DAYS)
                    .catch(() => '7');
                const autoReleaseDate = new Date();
                autoReleaseDate.setDate(
                    autoReleaseDate.getDate() + parseInt(autoReleaseDays || '7'),
                );

                await tx.heldBalance.create({
                    data: {
                        orderId: savedOrder.id,
                        customerId: user.id,
                        vendorId: createOrderDto.vendorId,
                        driverId: null,
                        totalAmount: calcs.totalAmount,
                        vendorAmount: calcs.vendorEarnings || 0,
                        driverAmount: 0,
                        adminAmount: calcs.adminCommissionAmount || 0,
                        status: HeldBalanceStatus.HELD,
                        holdReason:
                            OrderConstants.HELD_BALANCE_REASON_AWAITING_CONFIRMATION,
                        autoReleaseDate,
                    },
                });

                await tx.order.update({
                    where: { id: savedOrder.id },
                    data: { paymentStatus: PaymentStatus.PAID },
                });
            }

            if (createOrderDto.cashbackId) {
                await this.cashbackService.redeem(user.id, {
                    cashbackId: createOrderDto.cashbackId,
                    orderId: savedOrder.id,
                    amount: 5,
                });
            }

            const vendor = await tx.vendor.findUnique({
                where: { id: createOrderDto.vendorId },
                select: { authorId: true },
            });

            if (vendor?.authorId) {
                await this.notificationService.sendOrderNotification(
                    vendor.authorId,
                    ORDERS_NOTIFICATIONS.ORDER_PLACED,
                    { orderId: savedOrder.id, status: savedOrder.status },
                );
            }

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
