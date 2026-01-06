import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverStatus, OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UploadDriverDocumentDto } from './dto/upload-driver-document.dto';

@Injectable()
export class DriversService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
  ) { }

  async create(createDriverDto: CreateDriverDto, userId: string) {
    const existingDriver = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (existingDriver) {
      throw new BadRequestException('DRIVER_PROFILE_EXISTS');
    }

    return this.prisma.driverProfile.create({
      data: {
        ...createDriverDto,
        user: { connect: { id: userId } },
        status: DriverStatus.OFFLINE,
      },
    });
  }

  findAll() {
    return this.prisma.driverProfile.findMany({
      include: { user: true },
    });
  }

  async findOne(id: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!driver) {
      throw new NotFoundException('DRIVER_NOT_FOUND');
    }
    return driver;
  }

  async findByUser(userId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    return driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    await this.findOne(id);
    return this.prisma.driverProfile.update({
      where: { id },
      data: updateDriverDto as Prisma.DriverProfileUpdateInput,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.driverProfile.delete({
      where: { id },
    });
  }

  async findAvailable(lat?: number, lng?: number, radius?: number) {
    // For now, just return all available drivers.
    // lat, lng, radius are placeholders for spatial query
    return this.prisma.driverProfile.findMany({
      where: {
        status: DriverStatus.AVAILABLE,
        isOnline: true,
      },
      include: { user: true },
    });
  }

  async getOrders(userId: string, query: Record<string, any>) {
    return this.ordersService.findAll(
      { id: userId, role: UserRole.DRIVER },
      query,
    );
  }

  async getStatus(userId: string) {
    const driver = await this.findByUser(userId);
    if (!driver) {
      throw new NotFoundException('DRIVER_NOT_FOUND');
    }
    return {
      status: driver.status,
      isOnline: driver.isOnline,
      latitude: driver.currentLat,
      longitude: driver.currentLng,
    };
  }

  async updateStatus(
    userId: string,
    status: DriverStatus,
    isOnline?: boolean,
    latitude?: number,
    longitude?: number,
  ) {
    const driver = await this.findByUser(userId);
    if (!driver) {
      throw new NotFoundException('DRIVER_NOT_FOUND');
    }

    return this.prisma.driverProfile.update({
      where: { userId },
      data: {
        status: status || undefined,
        isOnline: isOnline !== undefined ? isOnline : undefined,
        currentLat: latitude !== undefined ? latitude : undefined,
        currentLng: longitude !== undefined ? longitude : undefined,
      },
    });
  }

  async getDocuments(userId: string) {
    const driver = await this.findByUser(userId);
    if (!driver) {
      throw new NotFoundException('DRIVER_NOT_FOUND');
    }
    return this.prisma.driverDocument.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadDocument(userId: string, data: UploadDriverDocumentDto) {
    const driver = await this.findByUser(userId);
    if (!driver) {
      throw new NotFoundException('DRIVER_NOT_FOUND');
    }
    return this.prisma.driverDocument.create({
      data: {
        ...data,
        driver: { connect: { id: driver.id } },
        status: 'pending',
      } as Prisma.DriverDocumentCreateInput,
    });
  }

  async getAllDocuments() {
    return this.prisma.driverDocument.findMany({
      include: {
        driver: {
          include: { user: true },
        },
      },
    });
  }

  async getEarnings(
    userId: string,
    period: 'daily' | 'monthly' | 'yearly',
    startDate: Date,
  ) {
    const driver = await this.findByUser(userId);
    if (!driver) {
      throw new NotFoundException('DRIVER_NOT_FOUND');
    }

    const endDate = new Date(startDate);
    switch (period) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    const orders = await this.prisma.order.findMany({
      where: {
        driverId: driver.id,
        status: OrderStatus.COMPLETED,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
      },
    });

    const totalEarnings = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    // Calculate driver commission (typically 80-90% of order total)
    const commissionRate = 0.85; // 85% to driver, 15% platform fee
    const driverEarnings = totalEarnings * commissionRate;

    return {
      period,
      startDate,
      endDate,
      totalOrders: orders.length,
      totalEarnings,
      driverEarnings: Math.round(driverEarnings * 100) / 100,
      platformFee: Math.round((totalEarnings - driverEarnings) * 100) / 100,
      orders,
    };
  }
}
