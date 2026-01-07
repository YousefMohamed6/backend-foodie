import { BadRequestException, Injectable } from '@nestjs/common';
import { DriverStatus, TransactionType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { SettingsService } from '../settings/settings.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private walletService: WalletService,
    private settingsService: SettingsService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { referralCode: inputReferralCode, deviceId, ...userData } = createUserDto as any;

    // Check if phone number already exists
    if (userData.phoneNumber) {
      const existingUser = await this.prisma.user.findFirst({
        where: { phoneNumber: userData.phoneNumber },
      });
      if (existingUser) {
        throw new BadRequestException('PHONE_NUMBER_ALREADY_EXISTS');
      }
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    let newReferralCode: string | undefined;
    if (userData.role === UserRole.CUSTOMER || !userData.role) {
      newReferralCode = this.generateReferralCode();
    }

    let referrerId: string | undefined;

    if (inputReferralCode) {
      let referrer = await this.prisma.user.findUnique({
        where: { referralCode: inputReferralCode },
      });

      // Handle common confusion: 0 (zero) entered as O (letter) or vice-versa
      // Since we generated codes with 0 and O previously, checks are needed
      if (!referrer && inputReferralCode.includes('0')) {
        referrer = await this.prisma.user.findUnique({
          where: { referralCode: inputReferralCode.replace(/0/g, 'O') },
        });
      }
      if (!referrer) {
        throw new BadRequestException('INVALID_REFERRAL_CODE');
      }
      referrerId = referrer.id;
    }

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        referralCode: newReferralCode,
        referredBy: referrerId,
        role: userData.role || UserRole.CUSTOMER,
        customerProfile:
          userData.role === UserRole.CUSTOMER || !userData.role
            ? { create: {} }
            : undefined,
        driverProfile:
          userData.role === UserRole.DRIVER
            ? { create: { status: DriverStatus.OFFLINE } }
            : undefined,
      },
    });

    if (referrerId) {
      // Get referral settings
      let rewardAmount = 0;
      try {
        const isEnabled = await this.settingsService.findOne('referral_enabled');
        if (isEnabled === 'true') {
          const amountSetting = await this.settingsService.findOne('referral_amount');
          if (amountSetting) {
            rewardAmount = Number(amountSetting);
            // Cap referral amount at 100
            if (rewardAmount > 100) {
              rewardAmount = 100;
            }
          }
        }
      } catch (error) {
        // If settings not found, use default of 0 (no reward)
      }

      // Create referral record
      await this.prisma.referral.create({
        data: {
          referrerId: referrerId,
          referredId: user.id,
          rewardAmount,
        },
      });

      // Credit referrer's wallet if reward amount is greater than 0
      if (rewardAmount > 0) {
        await this.prisma.walletTransaction.create({
          data: {
            userId: referrerId,
            amount: rewardAmount,
            type: TransactionType.DEPOSIT,
            description: `Referral reward for inviting new user`,
            paymentStatus: 'PAID',
          },
        });

        // Update referrer's wallet balance in customer profile
        await this.walletService.updateUserWallet(
          referrerId,
          rewardAmount,
          'add',
        );
      }
    }

    const { password, ...result } = user;
    return result;
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    // Invalidate cached user data
    await this.redisService.del(`user:${id}`);

    const { password, ...result } = user;
    return result;
  }

  async updateLocation(
    id: string,
    location: { latitude: number; longitude: number; rotation?: number },
  ) {
    const result = await this.prisma.driverProfile.upsert({
      where: { userId: id },
      update: {
        currentLat: location.latitude,
        currentLng: location.longitude,
        rotation: location.rotation,
      },
      create: {
        userId: id,
        currentLat: location.latitude,
        currentLng: location.longitude,
        rotation: location.rotation,
      },
    });

    // Invalidate cached user data
    await this.redisService.del(`user:${id}`);

    return result;
  }

  findByPhone(phoneNumber: string) {
    return this.prisma.user.findFirst({ where: { phoneNumber } });
  }

  async updatePassword(id: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Invalidate cached user data
    await this.redisService.del(`user:${id}`);

    const { password: _, ...result } = user;
    return result;
  }

  async updateToken(id: string, fcmToken: string) {
    await this.prisma.user.update({
      where: { id },
      data: { fcmToken },
    });

    // Invalidate cached user data (FCM token change doesn't require immediate cache clear but good practice)
    await this.redisService.del(`user:${id}`);

    return { success: true, message: 'Token updated successfully' };
  }

  async remove(id: string) {
    // Invalidate cached user data before deletion
    await this.redisService.del(`user:${id}`);

    return this.prisma.user.delete({ where: { id } });
  }
}
