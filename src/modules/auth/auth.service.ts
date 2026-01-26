import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EnvKeys } from '../../common/constants/env-keys.constants';
import { NodeEnv } from '../../common/enums/node-env.enum';
import { normalizePhoneNumber } from '../../common/utils/phone.utils';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { SmsService } from '../../shared/services/sms.service';
import { TimeService } from '../../shared/services/time.service';
import { UsersService } from '../users/users.service';
import { VendorsService } from '../vendors/vendors.service';
import { AUTH_ERRORS } from './auth.constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { VerifyFirebaseOtpDto } from './dto/verify-firebase-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AppleAuthService } from './services/apple-auth.service';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { GoogleAuthService } from './services/google-auth.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private googleAuthService: GoogleAuthService,
    private appleAuthService: AppleAuthService,
    private firebaseAuthService: FirebaseAuthService,
    private smsService: SmsService,
    private redisService: RedisService,
    private timeService: TimeService,
    @Inject(forwardRef(() => VendorsService))
    private vendorsService: VendorsService,
  ) { }

  async register(
    registerDto: RegisterDto,
    context: { ip: string; userAgent: string; deviceId?: string },
  ) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
    }

    // Security: Restrict public registration to specific roles
    if (
      registerDto.role &&
      !(
        [
          UserRole.CUSTOMER,
          UserRole.DRIVER,
          UserRole.VENDOR,
          UserRole.MANAGER,
        ] as UserRole[]
      ).includes(registerDto.role)
    ) {
      // Force to CUSTOMER or throw error. Throwing error is safer.
      throw new ForbiddenException(AUTH_ERRORS.ROLE_NOT_ALLOWED);
    }

    // Password hashing is handled in UsersService.create
    const user = await this.usersService.create(registerDto);

    return this.generateTokens(user, context);
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_INACTIVE);
    }

    return user;
  }

  async login(
    loginDto: LoginDto,
    context: { ip: string; userAgent: string; deviceId?: string },
  ) {
    // Correct approach: use UsersService to find by email + bcrypt check
    const validUser = await this.usersService.findByEmail(loginDto.email);
    if (
      !validUser ||
      !(await bcrypt.compare(loginDto.password, validUser.password))
    ) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    // Ensure active
    if (!validUser.isActive) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_INACTIVE);
    }

    return this.generateTokens(validUser, context);
  }

  async socialLogin(
    socialLoginDto: SocialLoginDto,
    context: { ip: string; userAgent: string; deviceId?: string },
  ) {
    let email: string;
    let firstName: string | undefined;
    let lastName: string | undefined;
    let providerId: string; // Unique ID from the provider (sub)

    // Step 1: Verify the token and extract verified data
    if (socialLoginDto.provider === 'google') {
      const googlePayload = await this.googleAuthService.verifyIdToken(
        socialLoginDto.idToken,
      );

      email = googlePayload.email;
      firstName = googlePayload.given_name || socialLoginDto.firstName;
      lastName = googlePayload.family_name || socialLoginDto.lastName;
      providerId = googlePayload.sub;
    } else if (socialLoginDto.provider === 'apple') {
      const applePayload = await this.appleAuthService.verifyIdentityToken(
        socialLoginDto.idToken,
      );

      email = applePayload.email;
      // Apple only sends name on first login, so use DTO values if provided
      firstName = socialLoginDto.firstName;
      lastName = socialLoginDto.lastName;
      providerId = applePayload.sub;
    } else {
      throw new UnauthorizedException(AUTH_ERRORS.UNSUPPORTED_PROVIDER);
    }

    // Step 2: Find or create user with VERIFIED email
    let user: User | Omit<User, 'password'> | null =
      await this.usersService.findByEmail(email);

    if (!user) {
      // Create new user with verified data
      user = await this.usersService.create({
        email,
        firstName: firstName || 'User',
        lastName: lastName || '',
        password: crypto.randomBytes(32).toString('hex'), // Random password for social users
        provider: socialLoginDto.provider,
        devicePlatform: socialLoginDto.devicePlatform,
      } as any);

      this.logger.log(
        `New user created via ${socialLoginDto.provider}: ${email}`,
      );
    } else {
      // Update name if provided (useful for Apple's first login)
      if (firstName || lastName) {
        await this.usersService.update(user.id, {
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
        } as any);
      }
    }

    if (!user)
      throw new UnauthorizedException(AUTH_ERRORS.USER_CREATION_FAILED);

    if (!user.isActive) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_INACTIVE);
    }

    return this.generateTokens(user, context);
  }

  async sendOtp(sendOtpDto: SendOtpDto) {
    let { phoneNumber } = sendOtpDto;
    phoneNumber = normalizePhoneNumber(phoneNumber);

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Store in Redis with 5-minute expiry
    const otpKey = `otp:${phoneNumber}`;
    await this.redisService.set(otpKey, otp, 300); // 5 minutes

    // 3. Send SMS
    try {
      await this.smsService.sendOtp(phoneNumber, otp);
      this.logger.log(`OTP sent to ${phoneNumber}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP to ${phoneNumber}: ${err.message}`);
      // In development, we might want to return the OTP in the response or just log it
      if (process.env[EnvKeys.NODE_ENV] !== NodeEnv.PRODUCTION) {
        return { verificationId: otpKey, devOtp: otp };
      }
      throw new BadRequestException(AUTH_ERRORS.OTP_SEND_FAILED);
    }

    return { verificationId: otpKey };
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
    context: { ip: string; userAgent: string; deviceId?: string },
  ) {
    let { phoneNumber, code } = verifyOtpDto;
    phoneNumber = normalizePhoneNumber(phoneNumber);
    const otpKey = `otp:${phoneNumber}`;

    // 1. Verify OTP code
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp || storedOtp !== code) {
      // Always change/invalidate OTP for any request/attempt that fails
      await this.redisService.del(otpKey);
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_OTP);
    }

    // 2. Clear OTP after successful verification
    await this.redisService.del(otpKey);

    // 3. Find user and login
    const user = await this.usersService.findByPhone(phoneNumber);
    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.PHONE_NOT_REGISTERED);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_INACTIVE);
    }

    return this.generateTokens(user, context);
  }

  async verifyFirebaseOtp(
    dto: VerifyFirebaseOtpDto,
    context: { ip: string; userAgent: string; deviceId?: string },
  ) {
    const decodedToken = await this.firebaseAuthService.verifyIdToken(
      dto.idToken,
    );

    if (!decodedToken.phoneNumber) {
      throw new UnauthorizedException(AUTH_ERRORS.FIREBASE_PHONE_NOT_FOUND);
    }

    const phoneNumber = normalizePhoneNumber(decodedToken.phoneNumber);

    let user: any = await this.usersService.findByPhone(phoneNumber);

    if (!user) {
      if (
        dto.role &&
        !(
          [
            UserRole.CUSTOMER,
            UserRole.DRIVER,
            UserRole.VENDOR,
            UserRole.MANAGER,
          ] as UserRole[]
        ).includes(dto.role)
      ) {
        throw new ForbiddenException(AUTH_ERRORS.ROLE_NOT_ALLOWED);
      }

      const newUserData = {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: crypto.randomBytes(32).toString('hex'),
        phoneNumber,
        role: dto.role || UserRole.CUSTOMER,
        provider: 'phone',
        fcmToken: dto.fcmToken,
        devicePlatform: dto.devicePlatform,
        referralCode: dto.referralCode,
        zoneId: dto.zoneId,
      };

      user = await this.usersService.create(newUserData as any);
      this.logger.log(
        `New user created via Firebase Phone Auth: ${phoneNumber}`,
      );
    } else {
      if (dto.fcmToken && dto.fcmToken !== user.fcmToken) {
        await this.usersService.updateToken(user.id, dto.fcmToken);
      }
    }

    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_CREATION_FAILED);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_INACTIVE);
    }

    return this.generateTokens(user, context);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
    }
    // Generate reset token and send email
    return { message: 'Password reset link sent to email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // Verify token and reset password
    const user = await this.usersService.findByEmail(resetPasswordDto.email);
    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    await this.usersService.updatePassword(user.id, resetPasswordDto.password);
    // Revoke all refresh tokens on password change
    await this.revokeAllRefreshTokens(user.id);

    return { message: 'Password successfully reset' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendor: true,
        zone: true,
      },
    });

    if (!user) {
      throw new NotFoundException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    // For VENDOR role, return vendor data with author field
    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      if (vendor) {
        // Return vendor with author (user) embedded
        return {
          ...vendor,
          author: this.mapUserResponse(user),
        };
      } else {
        // No vendor profile yet - return user data as author structure
        return {
          author: this.mapUserResponse(user),
        };
      }
    }

    return this.mapUserResponse(user);
  }

  async logout(userId: string) {
    await this.revokeAllRefreshTokens(userId);
    return { message: 'Successfully logged out' };
  }

  async refreshTokens(
    refreshToken: string,
    context: { ip: string; userAgent: string; deviceId?: string },
  ) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('app.jwtRefreshSecret'),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user) throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);

      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: tokenHash },
      });

      if (!storedToken)
        throw new ForbiddenException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
      if (storedToken.revoked) {
        // Reuse detection: revoke all tokens for this user
        await this.revokeAllRefreshTokens(user.id);
        throw new ForbiddenException(AUTH_ERRORS.REFRESH_TOKEN_REUSE_DETECTED);
      }
      if (storedToken.expiresAt < this.timeService.now()) {
        throw new ForbiddenException(AUTH_ERRORS.REFRESH_TOKEN_EXPIRED);
      }

      // Validate binding
      if (storedToken.deviceId && storedToken.deviceId !== context.deviceId) {
        throw new ForbiddenException(AUTH_ERRORS.DEVICE_MISMATCH);
      }

      // Rotate token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });

      return this.generateTokens(user, context);
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new ForbiddenException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }
  }

  private async generateTokens(
    user: User | Omit<User, 'password'>,
    context?: { ip: string; userAgent: string; deviceId?: string },
  ) {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('app.jwtSecret'),
        expiresIn: (this.configService.get<string>('app.jwtExpiration') ||
          '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('app.jwtRefreshSecret'),
        expiresIn: (this.configService.get<string>(
          'app.jwtRefreshExpiration',
        ) || '7d') as any,
      }),
    ]);

    await this.storeRefreshToken(refreshToken, user.id, context);

    // For VENDOR role, return vendor data with author field
    let responseUser: any = user;
    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      if (vendor) {
        // Return vendor with author (user) embedded
        responseUser = {
          ...vendor,
          author: this.mapUserResponse(user as User),
        };
      } else {
        // No vendor profile yet - return user data as author structure
        responseUser = {
          author: this.mapUserResponse(user as User),
        };
      }
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: responseUser,
    };
  }

  private async storeRefreshToken(
    token: string,
    userId: string,
    context?: { ip: string; userAgent: string; deviceId?: string },
  ) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiryDate = this.timeService.now();
    expiryDate.setDate(expiryDate.getDate() + 7); // Should match config

    await this.prisma.refreshToken.create({
      data: {
        token: tokenHash,
        userId,
        expiresAt: expiryDate,
        deviceId: context?.deviceId,
        userAgent: context?.userAgent,
      },
    });
  }

  private async revokeAllRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  private mapUserResponse(user: User) {
    const {
      password,
      isDocumentVerify,
      subscriptionPlanId,
      subscriptionExpiryDate,
      ...result
    } = user as any;
    return result;
  }
}
