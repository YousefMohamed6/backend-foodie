import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { FawaterakService } from '../../shared/services/fawaterak.service';
import {
  SetWithdrawMethodDto,
  TopUpWalletDto,
  WithdrawWalletDto,
} from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private readonly fawaterakService: FawaterakService,
  ) { }

  async getBalance(userId: string) {
    const getSum = async (type: TransactionType) => {
      const depositFilter =
        type === TransactionType.DEPOSIT
          ? {
            OR: [{ paymentStatus: 'PAID' }, { paymentStatus: null }],
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
    if (topUpDto.paymentGateway.toLowerCase() !== 'fawaterak') {
      throw new BadRequestException('Unsupported payment gateway');
    }
    if (!topUpDto.successUrl || !topUpDto.failUrl || !topUpDto.pendingUrl) {
      throw new BadRequestException('Redirection URLs are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true, phoneNumber: true },
    });
    if (!user?.email || !user?.phoneNumber) {
      throw new BadRequestException('User profile is missing required payment data');
    }

    const transactionId = crypto.randomUUID();
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        id: transactionId,
        userId,
        amount: topUpDto.amount,
        type: TransactionType.DEPOSIT,
        description: `Top up via ${topUpDto.paymentMethod}`,
        isTopup: true,
        paymentStatus: 'PENDING',
        referenceId: transactionId,
        metadata: {
          gateway: 'fawaterak',
          paymentGateway: topUpDto.paymentGateway,
          paymentMethod: topUpDto.paymentMethod,
        },
      },
    });

    const invoice = await this.fawaterakService.createInvoiceLink({
      amount: topUpDto.amount,
      currency: 'EGP',
      customer: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        phone: user.phoneNumber,
        address: 'N/A',
      },
      redirectionUrls: {
        successUrl: topUpDto.successUrl,
        failUrl: topUpDto.failUrl,
        pendingUrl: topUpDto.pendingUrl,
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
      throw new BadRequestException('Insufficient funds');
    }

    const transaction = await this.prisma.walletTransaction.create({
      data: {
        userId,
        amount: withdrawDto.amount,
        type: TransactionType.WITHDRAWAL,
        description: 'Withdrawal request',
        metadata: {
          withdrawMethodId: withdrawDto.withdrawMethodId,
          accountDetails: withdrawDto.accountDetails,
        },
      },
    });

    // Deduct immediately?
    // Usually withdrawals are requests. But to reflect in balance calculation (deposits - withdrawals),
    // creating the record naturally deducts it from getBalance() result.

    // However, if we maintain walletAmount on User:
    await this.updateUserWallet(
      userId,
      withdrawDto.amount,
      'subtract',
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
    description: string,
    orderId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const balance = await this.getBalance(userId);
    if (balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const transaction = await prisma.walletTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.PAYMENT,
        description,
        orderId,
      },
    });

    // Sync with User entity walletAmount
    await this.updateUserWallet(userId, amount, 'subtract', prisma);

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
    type: 'add' | 'subtract',
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const profile = await prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (profile) {
      const current = profile.walletAmount.toNumber();
      const newBalance = type === 'add' ? current + amount : current - amount;
      await prisma.customerProfile.update({
        where: { userId },
        data: { walletAmount: newBalance },
      });
    }
  }

  async getTopUpStatus(userId: string, transactionId: string) {
    const tx = await this.prisma.walletTransaction.findFirst({
      where: { id: transactionId, userId, isTopup: true, type: TransactionType.DEPOSIT },
      select: { paymentStatus: true },
    });
    if (!tx) {
      throw new NotFoundException('Topup transaction not found');
    }
    return { status: tx.paymentStatus || 'PAID' };
  }
}
