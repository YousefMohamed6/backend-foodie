import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SetWithdrawMethodDto, TopUpWalletDto, WithdrawWalletDto } from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) { }

  async getBalance(userId: string) {
    const getSum = async (type: TransactionType) => {
      const aggregations = await this.prisma.walletTransaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          userId,
          type,
        },
      });
      return aggregations._sum.amount ? aggregations._sum.amount.toNumber() : 0;
    };
    const deposits = await getSum(TransactionType.DEPOSIT);
    const withdrawals = await getSum(TransactionType.WITHDRAWAL);
    const payments = await getSum(TransactionType.PAYMENT);
    return deposits - withdrawals - payments;
  }

  async getTransactions(userId: string, query: { limit?: string | number; page?: string | number } = {}) {
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
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        userId,
        amount: topUpDto.amount,
        type: TransactionType.DEPOSIT,
        description: `Top up via ${topUpDto.paymentMethod}`,
        isTopup: true,
        metadata: {
          paymentGateway: topUpDto.paymentGateway,
          paymentMethod: topUpDto.paymentMethod,
        },
      },
    });

    // Validating and updating user wallet balance logic should ideally be transactional or rely on aggregation
    // For now, mirroring previous logic which implies external payment verification?
    // The comment said: // Here you would integrate with payment gateway
    // And update user balance

    // Sync with User entity walletAmount
    await this.updateUserWallet(userId, topUpDto.amount, 'add', this.prisma);

    return {
      transaction,
      paymentUrl: 'https://payment-gateway-mock.com/pay', // Mock URL
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
    await this.updateUserWallet(userId, withdrawDto.amount, 'subtract', this.prisma);

    return transaction;
  }

  async getWithdrawals(userId: string, query: { limit?: string | number; page?: string | number } = {}) {
    return this.prisma.walletTransaction.findMany({
      where: { userId, type: TransactionType.WITHDRAWAL },
      orderBy: { createdAt: 'desc' },
      take: Number(query.limit) || 20,
      skip: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 20) || 0,
    });
  }

  async pay(userId: string, amount: number, description: string, orderId?: string, tx?: Prisma.TransactionClient) {
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

  private async updateUserWallet(
    userId: string,
    amount: number,
    type: 'add' | 'subtract',
    tx?: Prisma.TransactionClient
  ) {
    const prisma = tx || this.prisma;
    const profile = await prisma.customerProfile.findUnique({ where: { userId } });
    if (profile) {
      const current = profile.walletAmount.toNumber();
      const newBalance = type === 'add' ? current + amount : current - amount;
      await prisma.customerProfile.update({
        where: { userId },
        data: { walletAmount: newBalance },
      });
    }
  }
}
