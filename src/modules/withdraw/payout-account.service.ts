import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePayoutAccountDto,
  UpdatePayoutAccountDto,
} from './dto/payout-account.dto';

import { RedisService } from '../../shared/services/redis.service';

@Injectable()
export class PayoutAccountService {
  private readonly CACHE_KEY_PREFIX = 'payout_accounts_user_';

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  private getCacheKey(userId: string): string {
    return `${this.CACHE_KEY_PREFIX}${userId}`;
  }

  async create(userId: string, dto: CreatePayoutAccountDto) {
    // Invalidate cache
    await this.redisService.del(this.getCacheKey(userId));

    // If setting as default, unset others
    if (dto.isDefault) {
      await this.prisma.payoutAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.payoutAccount.create({
      data: {
        userId,
        method: dto.method,
        details: dto.details as Prisma.InputJsonValue,
        isDefault: dto.isDefault || false,
      },
    });
  }

  async findAll(userId: string) {
    const cacheKey = this.getCacheKey(userId);
    const cachedAccounts = await this.redisService.get<any[]>(cacheKey);

    if (cachedAccounts) {
      return cachedAccounts;
    }

    const accounts = await this.prisma.payoutAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Cache for 1 hour
    await this.redisService.set(cacheKey, accounts, 3600);

    return accounts;
  }

  async findOne(id: string, userId: string) {
    const account = await this.prisma.payoutAccount.findFirst({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException('Payout account not found');
    }
    return account;
  }

  async update(id: string, userId: string, dto: UpdatePayoutAccountDto) {
    // Invalidate cache
    await this.redisService.del(this.getCacheKey(userId));

    const account = await this.findOne(id, userId);

    if (dto.isDefault) {
      await this.prisma.payoutAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.payoutAccount.update({
      where: { id },
      data: {
        details: dto.details
          ? (dto.details as Prisma.InputJsonValue)
          : undefined,
        isDefault: dto.isDefault,
      },
    });
  }

  async remove(id: string, userId: string) {
    // Invalidate cache
    await this.redisService.del(this.getCacheKey(userId));

    const account = await this.findOne(id, userId);
    return this.prisma.payoutAccount.delete({
      where: { id },
    });
  }
}
