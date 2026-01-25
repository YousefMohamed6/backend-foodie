import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, TransactionType } from '@prisma/client';
import crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { FawaterakService } from '../../shared/services/fawaterak.service';
import {
  SetWithdrawMethodDto,
  TopUpWalletDto,
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

  async getBalance(userId: string) {
    const getSum = async (type: TransactionType) => {
      const depositFilter =
        type === TransactionType.DEPOSIT
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
          ...depositFilter,
        },
      });
      return aggregations._sum.amount ? aggregations._sum.amount.toNumber() : 0;
    };
    const deposits = await getSum(TransactionType.DEPOSIT);
    const withdrawals = await getSum(TransactionType.WITHDRAWAL);
    const payments = await getSum(TransactionType.PAYMENT);
    return deposits - withdrawals - payments;
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

  async topUp(userId: string, topUpDto: TopUpWalletDto) {
    if (
      topUpDto.paymentGateway.toLowerCase() !==
      WalletConstants.GATEWAY_FAWATERAK
    ) {
      throw new BadRequestException('UNSUPPORTED_PAYMENT_GATEWAY');
    }
    if (!topUpDto.successUrl || !topUpDto.failUrl || !topUpDto.pendingUrl) {
      throw new BadRequestException('REDIRECT_URLS_REQUIRED');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
      },
    });
    if (!user?.email || !user?.phoneNumber) {
      throw new BadRequestException('MISSING_PAYMENT_DATA');
    }

    const transactionId = crypto.randomUUID();
    const topUpDescriptions = WalletTransactionDescriptions.topUp(
      topUpDto.paymentMethod,
    );
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        id: transactionId,
        userId,
        amount: topUpDto.amount,
        type: TransactionType.DEPOSIT,
        descriptionEn: topUpDescriptions.en,
        descriptionAr: topUpDescriptions.ar,
        isTopup: true,
        paymentStatus: WalletConstants.PAYMENT_STATUS_PENDING,
        referenceId: transactionId,
        metadata: {
          gateway: WalletConstants.GATEWAY_FAWATERAK,
          paymentGateway: topUpDto.paymentGateway,
          paymentMethod: topUpDto.paymentMethod,
        },
      },
    });

    const invoice = await this.fawaterakService.createInvoiceLink({
      amount: topUpDto.amount,
      currency: WalletConstants.CURRENCY_EGP,
      customer: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        phone: user.phoneNumber,
        address: WalletConstants.ADDRESS_NA,
        customer_unique_id: userId,
      },
      redirectionUrls: {
        successUrl: topUpDto.successUrl || `${this.configService.get('app.baseUrl')}/api/v1/payments/redirect`,
        failUrl: topUpDto.failUrl || `${this.configService.get('app.baseUrl')}/api/v1/payments/redirect`,
        pendingUrl: topUpDto.pendingUrl || `${this.configService.get('app.baseUrl')}/api/v1/payments/redirect`,
      },
      payLoad: { referenceId: transaction.id },
    });

    const updated = await this.prisma.walletTransaction.update({
      where: { id: transaction.id },
      data: {
        metadata: {
          ...(transaction.metadata as any),
          invoiceId: invoice.invoiceId,
          invoiceKey: invoice.invoiceKey,
          paymentUrl: invoice.url,
        },
      },
    });

    return {
      paymentUrl: invoice.url,
      transactionId: updated.id,
      invoiceId: invoice.invoiceId,
    };
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
}
