import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DriverStatus, TransactionType, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { normalizePhoneNumber } from '../../common/utils/phone.utils';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { APP_SETTINGS } from '../settings/settings.constants';
import { SettingsService } from '../settings/settings.service';
import { VendorsService } from '../vendors/vendors.service';
import { WalletTransactionDescriptions } from '../wallet/wallet-transaction.constants';
import { WalletConstants } from '../wallet/wallet.constants';
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
    @Inject(forwardRef(() => VendorsService))
    private vendorsService: VendorsService,
  ) { }

  async findMe(id?: string) {
    if (!id) {
      throw new UnauthorizedException('PLEASE_LOG_IN');
    }

    const cacheKey = `user:${id}:me`;
    const cached = await this.redisService.get<any>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('USER_NOT_FOUND');
    }

    if (user.isActive === false) {
      throw new BadRequestException('USER_INACTIVE');
    }

    // Map user to author (exclude password and subscription-related fields)
    const mapUserToAuthor = (u: typeof user) => {
      const {
        password,
        isDocumentVerify,
        subscriptionPlanId,
        subscriptionExpiryDate,
        ...authorData
      } = u;
      return authorData;
    };

    let result;

    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      if (vendor) {
        // Return vendor with author (user) embedded
        result = {
          ...vendor,
          author: mapUserToAuthor(user),
        };
      } else {
        // No vendor profile yet - return user data as author structure
        result = {
          author: mapUserToAuthor(user),
        };
      }
    } else if (user.role === UserRole.DRIVER) {
      const driver = await this.prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });
      const { password, ...userData } = user;
      result = {
        ...userData,
        isOnline: driver?.isOnline ?? false,
        walletAmount: driver?.walletAmount ?? 0,
        lat: driver?.currentLat,
        lng: driver?.currentLng,
      };
    } else {
      const customer = await this.prisma.customerProfile.findUnique({
        where: { userId: user.id },
      });
      const { password, ...userData } = user;
      result = {
        ...userData,
        walletAmount: customer?.walletAmount ?? 0,
      };
    }

    await this.redisService.set(cacheKey, result, 3600);
    return result;
  }

  async create(createUserDto: CreateUserDto) {
    const {
      referralCode: inputReferralCode,
      deviceId,
      ...userData
    } = createUserDto as any;

    // Normalize phone number
    if (userData.phoneNumber) {
      userData.phoneNumber = normalizePhoneNumber(userData.phoneNumber);
    }

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (existingEmail) {
      throw new BadRequestException('EMAIL_ALREADY_EXISTS');
    }

    // Check if phone number already exists
    if (userData.phoneNumber) {
      const existingUser = await this.prisma.user.findFirst({
        where: { phoneNumber: userData.phoneNumber },
      });
      if (existingUser) {
        throw new BadRequestException('PHONE_NUMBER_ALREADY_EXISTS');
      }
    }

    // Check if FCM token already exists
    if (userData.fcmToken) {
      const existingFcm = await this.prisma.user.findUnique({
        where: { fcmToken: userData.fcmToken },
      });
      if (existingFcm) {
        throw new BadRequestException('FCM_TOKEN_ALREADY_EXISTS');
      }
    }

    // Ensure zoneId is required for certain roles during registration
    // Note: VENDOR role is excluded here as vendors complete their profile (including zone) after registration
    const mandatoryRoles: UserRole[] = [
      UserRole.DRIVER,
      UserRole.MANAGER,
    ];
    const role = userData.role || UserRole.CUSTOMER;
    if (mandatoryRoles.includes(role) && !userData.zoneId) {
      throw new BadRequestException('ZONE_ID_REQUIRED_FOR_THIS_ROLE');
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
        const isEnabled = await this.settingsService.findOne(
          APP_SETTINGS.REFERRAL_ENABLED,
        );
        if (isEnabled === 'true') {
          const amountSetting = await this.settingsService.findOne(
            APP_SETTINGS.REFERRAL_AMOUNT,
          );
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
        const descriptions = WalletTransactionDescriptions.referralBonus(
          inputReferralCode || 'UNKNOWN',
        );
        await this.prisma.walletTransaction.create({
          data: {
            userId: referrerId,
            amount: rewardAmount,
            type: TransactionType.DEPOSIT,
            descriptionEn: descriptions.en,
            descriptionAr: descriptions.ar,
            paymentStatus: WalletConstants.PAYMENT_STATUS_PAID,
          },
        });

        // Update referrer's wallet balance in customer profile
        await this.walletService.updateUserWallet(
          referrerId,
          rewardAmount,
          WalletConstants.OPERATION_ADD,
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
    const cacheKey = `user:${id}:one`;
    const cached = await this.redisService.get<Omit<User, 'password'>>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const { password, ...result } = user;

    await this.redisService.set(cacheKey, result, 3600);
    return result;
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.phoneNumber) {
      updateUserDto.phoneNumber = normalizePhoneNumber(
        updateUserDto.phoneNumber,
      );
    }

    // Ensure zoneId is not removed for mandatory roles
    const userToUpdate = await this.prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) {
      throw new BadRequestException('USER_NOT_FOUND');
    }

    const mandatoryRoles: UserRole[] = [
      UserRole.DRIVER,
      UserRole.VENDOR,
      UserRole.MANAGER,
    ];
    if (mandatoryRoles.includes(userToUpdate.role)) {
      if (
        updateUserDto.zoneId === null ||
        (updateUserDto.hasOwnProperty('zoneId') && !updateUserDto.zoneId)
      ) {
        throw new BadRequestException('ZONE_ID_REQUIRED_FOR_THIS_ROLE');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    // Invalidate cached user data
    await this.redisService.delPattern(`user:${id}:*`);

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
    await this.redisService.delPattern(`user:${id}:*`);

    return result;
  }

  findByPhone(phoneNumber: string) {
    const normalized = normalizePhoneNumber(phoneNumber);
    return this.prisma.user.findFirst({ where: { phoneNumber: normalized } });
  }

  async updatePassword(id: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Invalidate cached user data
    await this.redisService.delPattern(`user:${id}:*`);

    const { password: _, ...result } = user;
    return result;
  }

  async updateToken(id: string, fcmToken: string) {
    await this.prisma.user.update({
      where: { id },
      data: { fcmToken },
    });

    // Invalidate cached user data (FCM token change doesn't require immediate cache clear but good practice)
    await this.redisService.delPattern(`user:${id}:*`);

    return { success: true, message: 'Token updated successfully' };
  }

  async remove(id: string) {
    // Invalidate cached user data
    await this.redisService.delPattern(`user:${id}:*`);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
