import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCashbackDto } from './dto/create-cashback.dto';

@Injectable()
export class CashbackService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.cashback.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const cashback = await this.prisma.cashback.findUnique({ where: { id } });
    if (!cashback) {
      throw new NotFoundException(`Cashback with ID ${id} not found`);
    }
    return cashback;
  }

  async getRedeemed(cashbackId: string, userId: string) {
    return this.prisma.cashbackRedeem.findMany({
      where: { cashbackId, userId },
      include: { cashback: true },
    });
  }

  async create(data: CreateCashbackDto) {
    return this.prisma.cashback.create({
      data,
    });
  }

  async redeem(
    userId: string,
    data: { cashbackId: string; orderId: string; amount: number },
  ) {
    return this.prisma.cashbackRedeem.create({
      data: {
        userId,
        cashbackId: data.cashbackId,
        orderId: data.orderId,
        redeemedAmount: data.amount,
      },
    });
  }
}
