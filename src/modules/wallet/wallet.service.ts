import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FawaterakService } from '../../shared/services/fawaterak.service';
import {
  SetWithdrawMethodDto,
  WithdrawWalletDto,
} from './dto/wallet.dto';
import { WalletTransactionDescriptions } from './wallet-transaction.constants';
import { WalletConstants, WalletOperation } from './wallet.constants';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private readonly fawaterakService: FawaterakService,
    private readonly configService: ConfigService,
  ) { }

  async getBalance(userId: string, transactionUser?: string) {
    const getSum = async (type: TransactionType) => {
      const depositFilter =
        type === TransactionType.DEPOSIT || type === TransactionType.REFUND || type === TransactionType.PAYMENT
          ? {
            OR: [
              { paymentStatus: WalletConstants.PAYMENT_STATUS_PAID },
              { paymentStatus: null },
            ],
          }
          : {};
      const aggregations = await this.prisma.walletTransaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          userId,
          type,
          ...(transactionUser ? { transactionUser } : {}),
          ...depositFilter,
        },
      });
      return aggregations._sum.amount ? aggregations._sum.amount.toNumber() : 0;
    };

    const deposits = await getSum(TransactionType.DEPOSIT);
    const refunds = await getSum(TransactionType.REFUND);
    const withdrawals = await getSum(TransactionType.WITHDRAWAL);
    const payments = await getSum(TransactionType.PAYMENT);

    return deposits + refunds - withdrawals - payments;
  }

  async getTransactions(
    userId: string,
    query: { limit?: string | number; page?: string | number } = {},
  ) {
    return this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Number(query.limit) || 20,
      skip: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 20) || 0,
    });
  }

  async getFilterWalletTransaction(
    userId: string,
    startTime: Date,
    endTime: Date,
  ) {
    return this.prisma.walletTransaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async withdraw(userId: string, withdrawDto: WithdrawWalletDto) {
    const balance = await this.getBalance(userId);

    if (balance < withdrawDto.amount) {
      throw new BadRequestException('INSUFFICIENT_FUNDS');
    }

    const withdrawalDescriptions = WalletTransactionDescriptions.withdrawal();
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        userId,
        amount: withdrawDto.amount,
        type: TransactionType.WITHDRAWAL,
        descriptionEn: withdrawalDescriptions.en,
        descriptionAr: withdrawalDescriptions.ar,
        metadata: {
          withdrawMethodId: withdrawDto.withdrawMethodId,
          accountDetails: withdrawDto.accountDetails,
        },
      },
    });

    await this.updateUserWallet(
      userId,
      withdrawDto.amount,
      WalletConstants.OPERATION_SUBTRACT,
      this.prisma,
    );

    return transaction;
  }

  async getWithdrawals(
    userId: string,
    query: { limit?: string | number; page?: string | number } = {},
  ) {
    return this.prisma.walletTransaction.findMany({
      where: { userId, type: TransactionType.WITHDRAWAL },
      orderBy: { createdAt: 'desc' },
      take: Number(query.limit) || 20,
      skip: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 20) || 0,
    });
  }

  async pay(
    userId: string,
    amount: number,
    descriptionEn: string,
    descriptionAr: string,
    orderId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const balance = await this.getBalance(userId);
    if (balance < amount) {
      throw new BadRequestException('INSUFFICIENT_FUNDS');
    }

    const transaction = await prisma.walletTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.PAYMENT,
        descriptionEn,
        descriptionAr,
        orderId,
      },
    });

    // Sync with User entity walletAmount
    await this.updateUserWallet(
      userId,
      amount,
      WalletConstants.OPERATION_SUBTRACT,
      prisma,
    );

    return transaction;
  }

  async refund(
    userId: string,
    amount: number,
    descriptionEn: string,
    descriptionAr: string,
    orderId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const transaction = await prisma.walletTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.DEPOSIT,
        descriptionEn,
        descriptionAr,
        orderId,
      },
    });

    // Sync with User entity walletAmount
    await this.updateUserWallet(
      userId,
      amount,
      WalletConstants.OPERATION_ADD,
      prisma,
    );

    return transaction;
  }

  async getWithdrawMethod(userId: string) {
    return this.prisma.withdrawMethod.findUnique({
      where: { userId },
    });
  }

  async setWithdrawMethod(userId: string, data: SetWithdrawMethodDto) {
    const updateData: any = {};
    if (data.stripe) updateData.stripe = data.stripe;
    if (data.razorpay) updateData.razorpay = data.razorpay;
    if (data.paypal) updateData.paypal = data.paypal;
    if (data.flutterwave) updateData.flutterwave = data.flutterwave;

    return this.prisma.withdrawMethod.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });
  }

  async updateUserWallet(
    userId: string,
    amount: number,
    type: WalletOperation,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const profile = await prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (profile) {
      const current = profile.walletAmount.toNumber();
      const newBalance =
        type === WalletConstants.OPERATION_ADD
          ? current + amount
          : current - amount;
      await prisma.customerProfile.update({
        where: { userId },
        data: { walletAmount: newBalance },
      });
    }
  }

  async updateVendorWallet(
    vendorId: string,
    amount: number,
    type: WalletOperation,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (vendor) {
      const current = vendor.walletAmount.toNumber();
      const newBalance =
        type === WalletConstants.OPERATION_ADD
          ? current + amount
          : current - amount;
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { walletAmount: newBalance },
      });
    }
  }

  async addVendorEarnings(
    vendorId: string,
    userId: string, // Vendor's author/user ID
    amount: number,
    orderId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const descriptions = WalletTransactionDescriptions.vendorEarnings(orderId);
    await prisma.walletTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.DEPOSIT,
        descriptionEn: descriptions.en,
        descriptionAr: descriptions.ar,
        orderId,
        transactionUser: WalletConstants.TRANSACTION_USER_VENDOR,
      },
    });
    await this.updateVendorWallet(
      vendorId,
      amount,
      WalletConstants.OPERATION_ADD,
      prisma,
    );
  }

  async addDriverEarnings(
    driverId: string, // Driver's user ID
    amount: number,
    orderId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const descriptions = WalletTransactionDescriptions.driverEarnings(orderId);
    await prisma.walletTransaction.create({
      data: {
        userId: driverId,
        amount,
        type: TransactionType.DEPOSIT,
        descriptionEn: descriptions.en,
        descriptionAr: descriptions.ar,
        orderId,
        transactionUser: WalletConstants.TRANSACTION_USER_DRIVER,
      },
    });
    await this.updateDriverWallet(
      driverId,
      amount,
      WalletConstants.OPERATION_ADD,
      prisma,
    );
  }

  async addAdminCommission(
    amount: number,
    orderId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    let wallet = await prisma.adminWallet.findFirst();
    if (!wallet) {
      wallet = await prisma.adminWallet.create({ data: { walletAmount: 0 } });
    }

    await prisma.platformTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: WalletConstants.PLATFORM_TRANSACTION_TYPE_CREDIT,
        reason: `Commission from order ${orderId}`,
        orderId,
      },
    });

    await this.updateAdminWallet(amount, WalletConstants.OPERATION_ADD, prisma);
  }

  async updateDriverWallet(
    driverId: string,
    amount: number,
    type: WalletOperation,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: driverId },
    });
    if (profile) {
      const current = profile.walletAmount.toNumber();
      const newBalance =
        type === WalletConstants.OPERATION_ADD
          ? current + amount
          : current - amount;
      await prisma.driverProfile.update({
        where: { userId: driverId },
        data: { walletAmount: newBalance },
      });
    }
  }

  async updateAdminWallet(
    amount: number,
    type: WalletOperation,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const wallet = await prisma.adminWallet.findFirst();
    if (wallet) {
      const current = wallet.walletAmount.toNumber();
      const newBalance =
        type === WalletConstants.OPERATION_ADD
          ? current + amount
          : current - amount;
      await prisma.adminWallet.update({
        where: { id: wallet.id },
        data: { walletAmount: newBalance },
      });
    }
  }

  async getTopUpStatus(userId: string, transactionId: string) {
    const tx = await this.prisma.walletTransaction.findFirst({
      where: {
        id: transactionId,
        userId,
        isTopup: true,
        type: TransactionType.DEPOSIT,
      },
      select: { paymentStatus: true },
    });
    if (!tx) {
      throw new NotFoundException('TRANSACTION_NOT_FOUND');
    }
    return { status: tx.paymentStatus || WalletConstants.PAYMENT_STATUS_PAID };
  }

  /**
   * Reconciliation tool to find and fix discrepancies between ledger and profile balance
   */
  async reconcileUserWallet(userId: string, transactionUser?: string, applyFix = false) {
    const ledgerBalance = await this.getBalance(userId, transactionUser);

    let profileBalance = 0;
    const customer = await this.prisma.customerProfile.findUnique({ where: { userId } });
    const driver = await this.prisma.driverProfile.findUnique({ where: { userId } });

    if (transactionUser === WalletConstants.TRANSACTION_USER_DRIVER && driver) {
      profileBalance = driver.walletAmount.toNumber();
    } else if (transactionUser === WalletConstants.TRANSACTION_USER_VENDOR) {
      const vendor = await this.prisma.vendor.findFirst({ where: { authorId: userId } });
      profileBalance = Number(vendor?.walletAmount ?? 0);
    } else if (customer) {
      profileBalance = customer.walletAmount.toNumber();
    }

    const discrepancy = ledgerBalance - profileBalance;

    if (applyFix && discrepancy !== 0) {
      if (transactionUser === WalletConstants.TRANSACTION_USER_DRIVER) {
        await this.updateDriverWallet(userId, ledgerBalance, WalletConstants.OPERATION_ADD);
      } else {
        await this.updateUserWallet(userId, ledgerBalance, WalletConstants.OPERATION_ADD);
      }
    }

    return {
      userId,
      transactionUser,
      ledgerBalance,
      profileBalance,
      discrepancy,
      fixed: applyFix && discrepancy !== 0,
    };
  }
}
