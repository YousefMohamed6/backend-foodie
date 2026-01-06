import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { RedeemReferralDto } from './dto/referral.dto';

@Injectable()
export class ReferralsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) { }

  async getReferralCode(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
    if (!user.referralCode) {
      const referralCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      await this.prisma.user.update({
        where: { id: userId },
        data: { referralCode },
      });
      return { referralCode };
    }
    return { referralCode: user.referralCode };
  }

  async getHistory(userId: string) {
    return this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referred: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async redeem(userId: string, redeemDto: RedeemReferralDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.referredBy) {
      throw new BadRequestException('ALREADY_REFERRED');
    }

    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: redeemDto.referralCode },
    });

    if (!referrer) {
      throw new NotFoundException('INVALID_REFERRAL_CODE');
    }

    if (referrer.id === userId) {
      throw new BadRequestException('SELF_REFERRAL_NOT_ALLOWED');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { referredBy: referrer.id },
    });

    await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: userId,
        rewardAmount: 10, // Mock reward amount
      },
    });

    // In a real app, you might only give the reward after the first order
    // For now, let's give it immediately to the referrer if desired
    // await this.walletService.topUp(referrer.id, { amount: 10, ... });

    return { message: 'Referral code applied successfully' };
  }

  async validateCode(code: string) {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code },
    });
    return !!referrer;
  }

  async getUserByReferralCode(code: string) {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code },
    });
    if (!referrer) {
      throw new NotFoundException('REFERRER_NOT_FOUND');
    }
    return referrer;
  }
}
