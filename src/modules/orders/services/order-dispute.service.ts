import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    DeliveryConfirmationType,
    HeldBalanceStatus,
    OrderStatus,
    PaymentMethod,
    User,
    UserRole,
} from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { WalletProtectionService } from '../../wallet/wallet-protection.service';
import { WalletTransactionDescriptions } from '../../wallet/wallet-transaction.constants';
import { NotificationEventType, ORDERS_ERRORS } from '../orders.constants';

@Injectable()
export class OrderDisputeService {
    constructor(
        private prisma: PrismaService,
        private walletProtectionService: WalletProtectionService,
        private notificationService: NotificationService,
        private i18n: I18nService,
    ) { }

    /**
     * Customer confirms they received the order - releases wallet funds
     */
    async confirmDeliveryReceipt(
        orderId: string,
        user: User,
        confirmationType: DeliveryConfirmationType = DeliveryConfirmationType.CUSTOMER_CONFIRMATION,
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { heldBalance: true },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);
        if (order.authorId !== user.id)
            throw new ForbiddenException(ORDERS_ERRORS.NOT_YOUR_ORDER);
        if (order.status !== OrderStatus.COMPLETED) {
            throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_DELIVERED_YET);
        }
        if (order.paymentMethod !== PaymentMethod.wallet) {
            throw new BadRequestException(ORDERS_ERRORS.NOT_A_WALLET_ORDER);
        }
        if (
            !order.heldBalance ||
            order.heldBalance.status !== HeldBalanceStatus.HELD
        ) {
            throw new BadRequestException(
                ORDERS_ERRORS.NO_HELD_BALANCE_OR_ALREADY_PROCESSED,
            );
        }

        await this.walletProtectionService.releaseHeldBalance(
            orderId,
            confirmationType,
            WalletTransactionDescriptions.deliveryConfirmedReason().ar,
        );

        return {
            success: true,
            message: 'DELIVERY_CONFIRMED',
            releasedAmount: Number(order.heldBalance.totalAmount),
        };
    }

    /**
     * Customer disputes that they didn't receive the order
     */
    async createOrderDispute(
        orderId: string,
        user: User,
        reason: string,
        evidence?: { photos?: string[]; notes?: string },
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { heldBalance: true, disputes: true },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);
        if (order.authorId !== user.id)
            throw new ForbiddenException(ORDERS_ERRORS.NOT_YOUR_ORDER);
        if (order.status !== OrderStatus.COMPLETED) {
            throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_DELIVERED_YET);
        }
        if (order.paymentMethod !== PaymentMethod.wallet) {
            throw new BadRequestException(ORDERS_ERRORS.NOT_A_WALLET_ORDER);
        }
        if (
            !order.heldBalance ||
            order.heldBalance.status !== HeldBalanceStatus.HELD
        ) {
            throw new BadRequestException(
                ORDERS_ERRORS.NO_HELD_BALANCE_OR_ALREADY_PROCESSED,
            );
        }
        if (order.disputes && order.disputes.length > 0) {
            throw new BadRequestException(ORDERS_ERRORS.DISPUTE_ALREADY_EXISTS);
        }

        const dispute = await this.walletProtectionService.createDispute(
            orderId,
            user.id,
            reason,
            evidence,
        );

        if (order.driverId) {
            const titleEn = await this.i18n.translate(
                'messages.DELIVERY_DISPUTED_TITLE',
                { lang: 'en' },
            );
            const titleAr = await this.i18n.translate(
                'messages.DELIVERY_DISPUTED_TITLE',
                { lang: 'ar' },
            );
            const bodyEn = await this.i18n.translate(
                'messages.DELIVERY_DISPUTED_BODY',
                { lang: 'en', args: { orderId } },
            );
            const bodyAr = await this.i18n.translate(
                'messages.DELIVERY_DISPUTED_BODY',
                { lang: 'ar', args: { orderId } },
            );

            await this.notificationService.sendCustomNotification(
                [order.driverId],
                { en: titleEn, ar: titleAr },
                {
                    en: bodyEn,
                    ar: bodyAr,
                },
                {
                    orderId,
                    disputeId: dispute.id,
                    type: NotificationEventType.DISPUTE_CREATED,
                },
            );
        }

        return {
            success: true,
            message: 'DISPUTE_CREATED',
            disputeId: dispute.id,
        };
    }

    /**
     * Get order with held balance and dispute info
     */
    async getOrderProtectionStatus(orderId: string, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                heldBalance: true,
                disputes: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);
        if (
            order.authorId !== user.id &&
            user.role !== UserRole.ADMIN &&
            user.role !== UserRole.MANAGER
        ) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        return {
            orderId: order.id,
            paymentMethod: order.paymentMethod,
            status: order.status,
            heldBalance: order.heldBalance
                ? {
                    status: order.heldBalance.status,
                    totalAmount: Number(order.heldBalance.totalAmount),
                    autoReleaseDate: order.heldBalance.autoReleaseDate,
                    releasedAt: order.heldBalance.releasedAt,
                    releaseType: order.heldBalance.releaseType,
                }
                : null,
            dispute: order.disputes[0]
                ? {
                    id: order.disputes[0].id,
                    status: order.disputes[0].status,
                    reason: order.disputes[0].reason,
                    createdAt: order.disputes[0].createdAt,
                    resolvedAt: order.disputes[0].resolvedAt,
                }
                : null,
            canConfirmDelivery: order.heldBalance?.status === HeldBalanceStatus.HELD,
            canDispute:
                order.heldBalance?.status === HeldBalanceStatus.HELD &&
                order.disputes.length === 0,
        };
    }

    async getDeliveryOtp(orderId: string, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                authorId: true,
                status: true,
                deliveryOtp: true,
                paymentMethod: true,
            },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (order.authorId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        if (order.status !== OrderStatus.SHIPPED) {
            throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_SHIPPED);
        }

        if (order.paymentMethod !== PaymentMethod.wallet) {
            throw new BadRequestException(ORDERS_ERRORS.NOT_A_WALLET_ORDER);
        }

        const nextOtp = Math.floor(100000 + Math.random() * 900000).toString();
        await this.prisma.order.update({
            where: { id: orderId },
            data: { deliveryOtp: nextOtp },
        });

        return {
            orderId,
            otp: nextOtp,
        };
    }
}
