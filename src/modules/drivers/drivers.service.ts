import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus, DriverStatus, OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UploadDriverDocumentDto } from './dto/upload-driver-document.dto';
import { VerifyDriverDocumentDto } from './dto/verify-driver-document.dto';

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

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { role: UserRole.DRIVER },
      include: { driverProfile: true },
    });
    return users.map((u) => this.flattenDriver(u));
  }

  async findOne(id: string) {
    const driver = await this.prisma.driverProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: { user: true },
    });
    if (!driver) {
      throw new NotFoundException('DRIVER_NOT_FOUND');
    }
    return this.flattenDriver(driver);
  }

  async findByUser(userId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!driver) return null;
    return this.flattenDriver(driver);
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    const driver = await this.findOne(id);
    const updated = await this.prisma.driverProfile.update({
      where: { id: (driver as any).profileId },
      data: updateDriverDto as Prisma.DriverProfileUpdateInput,
      include: { user: true },
    });
    return this.flattenDriver(updated);
  }

  async remove(id: string) {
    const driver = await this.findOne(id);
    return this.prisma.driverProfile.delete({
      where: { id: (driver as any).profileId },
    });
  }

  async findAvailable() {
    const drivers = await this.prisma.driverProfile.findMany({
      where: {
        status: DriverStatus.AVAILABLE,
        isOnline: true,
      },
      include: { user: true },
    });
    return drivers.map((d) => this.flattenDriver(d));
  }

  private flattenDriver(data: any) {
    if (!data) return null;

    let user, profile;

    if (data.driverProfile !== undefined) {
      // Input is a User with included driverProfile
      const { driverProfile, ...userData } = data;
      user = userData;
      profile = driverProfile;
    } else if (data.user !== undefined) {
      // Input is a DriverProfile with included user
      const { user: userData, ...profileData } = data;
      user = userData;
      profile = profileData;
    } else {
      // Unknown format or direct User/Profile without inclusion
      // If it looks like a User, treat it as such
      if (data.role) {
        user = data;
        profile = data.driverProfile;
      } else {
        profile = data;
        user = data.user;
      }
    }

    return {
      ...(profile || {}),
      ...user,
      id: user?.id || data.id,
      profileId: profile?.id,
      user: user || null,
      driverProfile: profile || null,
    };
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
    status?: DriverStatus,
    isOnline?: boolean,
    latitude?: number,
    longitude?: number,
  ) {
    const driver = await this.findByUser(userId);
    if (!driver) {
      throw new NotFoundException('DRIVER_NOT_FOUND');
    }

    const data: Prisma.DriverProfileUpdateInput = {
      currentLat: latitude !== undefined ? latitude : undefined,
      currentLng: longitude !== undefined ? longitude : undefined,
    };

    if (isOnline !== undefined) {
      data.isOnline = isOnline;
      if (!isOnline) {
        data.status = DriverStatus.OFFLINE;
      } else if (!status && driver.status === DriverStatus.OFFLINE) {
        data.status = DriverStatus.AVAILABLE;
      }
    }

    if (status) {
      data.status = status;
    }

    return this.prisma.driverProfile.update({
      where: { userId },
      data,
    });
  }

  async getDocuments(userId: string) {
    const driver = await this.findByUser(userId);
    if (!driver) {
      throw new NotFoundException('DRIVER_NOT_FOUND');
    }
    const docs = await this.prisma.driverDocument.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((doc) => ({
      ...doc,
      status: doc.status.toLowerCase(),
    }));
  }

  async uploadDocument(userId: string, data: UploadDriverDocumentDto) {
    const driver = await this.findByUser(userId);
    if (!driver) {
      throw new NotFoundException('DRIVER_NOT_FOUND');
    }
    const { documentId, ...rest } = data;
    return this.prisma.driverDocument.upsert({
      where: {
        driverId_documentId: {
          driverId: driver.id,
          documentId: documentId,
        },
      },
      update: {
        ...rest,
        status: DocumentStatus.PENDING,
        rejectionReason: null,
      },
      create: {
        ...rest,
        document: { connect: { id: documentId } },
        driver: { connect: { id: driver.id } },
        status: DocumentStatus.PENDING,
      },
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

  async verifyDocument(dto: VerifyDriverDocumentDto) {
    const { documentId, isApproved } = dto;

    return this.prisma.driverDocument.update({
      where: { id: documentId },
      data: {
        status: isApproved
          ? DocumentStatus.ACCEPTED
          : DocumentStatus.REJECTED,
        rejectionReason: isApproved ? null : dto.rejectionReason,
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
        deliveryCharge: true,
        tipAmount: true,
        driverNet: true,
        driverCommissionValue: true,
        paymentMethod: true,
        createdAt: true,
        vendor: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals from actual order data
    const totals = orders.reduce(
      (acc, order) => {
        acc.totalDeliveryFees += Number(order.deliveryCharge) || 0;
        acc.totalTips += Number(order.tipAmount) || 0;
        acc.totalDriverNet += Number(order.driverNet) || 0;
        acc.totalPlatformCommission += Number(order.driverCommissionValue) || 0;
        return acc;
      },
      {
        totalDeliveryFees: 0,
        totalTips: 0,
        totalDriverNet: 0,
        totalPlatformCommission: 0,
      },
    );

    // Driver total earnings = driverNet + tips (tips are 100% for driver)
    const driverTotalEarnings = totals.totalDriverNet + totals.totalTips;

    return {
      period,
      startDate,
      endDate,
      totalOrders: orders.length,
      totalDeliveryFees: Math.round(totals.totalDeliveryFees * 100) / 100,
      totalTips: Math.round(totals.totalTips * 100) / 100,
      driverNet: Math.round(totals.totalDriverNet * 100) / 100,
      driverTotalEarnings: Math.round(driverTotalEarnings * 100) / 100,
      platformCommission: Math.round(totals.totalPlatformCommission * 100) / 100,
      orders: orders.map((order) => ({
        id: order.id,
        vendorName: order.vendor?.title || '',
        deliveryCharge: Number(order.deliveryCharge) || 0,
        tipAmount: Number(order.tipAmount) || 0,
        driverNet: Number(order.driverNet) || 0,
        platformCommission: Number(order.driverCommissionValue) || 0,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      })),
    };
  }
}
