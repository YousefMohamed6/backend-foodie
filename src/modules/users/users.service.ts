import { Injectable } from '@nestjs/common';
import { DriverStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        role: createUserDto.role || UserRole.CUSTOMER,
        customerProfile:
          createUserDto.role === UserRole.CUSTOMER || !createUserDto.role
            ? { create: {} }
            : undefined,
        driverProfile:
          createUserDto.role === UserRole.DRIVER
            ? { create: { status: DriverStatus.OFFLINE } }
            : undefined,
      },
    });
    const { password, ...result } = user;
    return result;
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
