import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    PaymentMethod,
    PaymentStatus,
    TransactionType,
    User,
    UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { WalletTransactionDescriptions } from '../../wallet/wallet-transaction.constants';
import { WalletService } from '../../wallet/wallet.service';
import { OrderManagementService } from '../order-management.service';
import { OrderConstants, ORDERS_ERRORS } from '../orders.constants';
import { OrdersGateway } from '../orders.gateway';
import { mapOrderResponse, orderInclude } from '../orders.helper';

@Injectable()
export class OrderCashService {
    constructor(
        private prisma: PrismaService,
        private managementService: OrderManagementService,
        private walletService: WalletService,
        private ordersGateway: OrdersGateway,
    ) { }

    async reportCashCollection(id: string, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (order.driverId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.DRIVER_NOT_ASSIGNED);
        }

        if (order.paymentMethod !== PaymentMethod.cash) {
            throw new BadRequestException(ORDERS_ERRORS.NOT_COD_ORDER);
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: { cashReportedAt: new Date() },
            include: orderInclude,
        });

        return this.emitUpdate(updatedOrder);
    }

    async confirmCashReceipt(id: string, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { vendor: true },
        });

        if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

        if (user.role !== UserRole.MANAGER) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        await this.managementService.validateManagerZoneAccess(
            user.id,
            order.vendor.zoneId,
        );

        if (!order.cashReportedAt) {
            throw new BadRequestException(ORDERS_ERRORS.CASH_NOT_REPORTED);
        }

        if (order.paymentStatus === PaymentStatus.PAID) {
            throw new BadRequestException(ORDERS_ERRORS.ORDER_ALREADY_PAID);
        }

        return await this.prisma.$transaction(async (tx) => {
            await tx.managerCashConfirmation.create({
                data: {
                    managerId: user.id,
                    driverId: order.driverId!,
                    orderId: id,
                    amount: order.totalAmount,
                },
            });

            const updatedOrder = await tx.order.update({
                where: { id },
                data: { paymentStatus: PaymentStatus.PAID },
                include: orderInclude,
            });

            const cashHandoverDescriptions =
                WalletTransactionDescriptions.cashHandover(id);
            await this.prisma.walletTransaction.create({
                data: {
                    userId: order.driverId!,
                    amount: Number(order.totalAmount),
                    type: TransactionType.DEPOSIT,
                    descriptionEn: cashHandoverDescriptions.en,
                    descriptionAr: cashHandoverDescriptions.ar,
                    orderId: id,
                    transactionUser: OrderConstants.DRIVER_TRANSACTION_USER,
                },
            });
            await this.walletService.updateDriverWallet(
                order.driverId!,
                Number(order.totalAmount),
                OrderConstants.WALLET_OPERATION_ADD,
                tx,
            );

            return this.emitUpdate(updatedOrder);
        });
    }

    async getManagerPendingCashOrders(user: User) {
        return this.managementService.getManagerPendingCashOrders(user);
    }

    async getManagerCashSummary(user: User, date: string) {
        return this.managementService.getManagerCashSummary(user, date);
    }

    async getDriverPendingCashOrders(driverId: string, user: User) {
        return this.managementService.getDriverPendingCashOrders(driverId, user);
    }

    async confirmManagerPayout(managerId: string, date: string, adminUser: User) {
        if (adminUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const confirmations = await this.prisma.managerCashConfirmation.findMany({
            where: {
                managerId,
                createdAt: { gte: startOfDay, lte: endOfDay },
            },
        });

        if (confirmations.length === 0) {
            throw new BadRequestException(ORDERS_ERRORS.NO_CASH_CONFIRMATIONS);
        }

        const totalAmount = confirmations.reduce(
            (sum, conf) => sum + Number(conf.amount),
            0,
        );

        return this.prisma.managerPayoutConfirmation.create({
            data: {
                managerId,
                adminId: adminUser.id,
                amount: totalAmount,
                payoutDate: startOfDay,
            },
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
