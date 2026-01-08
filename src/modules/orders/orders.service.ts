import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommissionSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  User,
  UserRole
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../shared/services/notification.service';
import { CashbackService } from '../cashback/cashback.service';
import { CouponsService } from '../coupons/coupons.service';
import { ProductsService } from '../products/products.service';
import { ReviewsService } from '../reviews/reviews.service';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from './commission.service';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderManagementService } from './order-management.service';
import { OrderPricingService } from './order-pricing.service';
import { OrdersGateway } from './orders.gateway';
import {
  calculateSubtotal,
  mapOrderResponse,
  orderInclude
} from './orders.helper';

export interface OrderItemExtra {
  id: string;
  name: string;
  price: Prisma.Decimal;
  orderItemId: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
    private couponsService: CouponsService,
    private cashbackService: CashbackService,
    private walletService: WalletService,
    private reviewsService: ReviewsService,
    private ordersGateway: OrdersGateway,
    private notificationService: NotificationService,
    private pricingService: OrderPricingService,
    private managementService: OrderManagementService,
    private commissionService: CommissionService,
  ) { }

  async create(createOrderDto: CreateOrderDto, user: User) {
    const { productMap, subtotal } = await this.resolveProductsAndSubtotal(createOrderDto);

    const calculations = await this.initializeOrderCalculations(createOrderDto, subtotal);

    return await this.finalizeOrderCreate(
      createOrderDto,
      user,
      productMap,
      subtotal,
      calculations,
    );
  }

  async findAll(
    user: Pick<User, 'id' | 'role'>,
    query: {
      vendorId?: string;
      status?: OrderStatus | string;
      firstOrder?: string;
      page?: string | number;
      limit?: string | number;
    },
  ) {
    if (user.role === UserRole.CUSTOMER && query.firstOrder === 'true') {
      const orderCount = await this.prisma.order.count({
        where: { authorId: user.id },
      });
      return { isFirstOrder: orderCount === 0 };
    }

    const where = await this.buildSearchFilters(user, query);
    if (!where) return [];

    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
      skip,
      take: limit,
    });

    return orders.map((order) => mapOrderResponse(order));
  }

  async count(where: Prisma.OrderWhereInput) {
    return this.prisma.order.count({ where });
  }

  async aggregate(args: Prisma.OrderAggregateArgs) {
    return this.prisma.order.aggregate(args);
  }

  async findOne(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    if (user.role === UserRole.CUSTOMER && order.authorId !== user.id) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    if (user.role === UserRole.MANAGER) {
      await this.managementService.validateManagerZoneAccess(user.id, order.vendor.zoneId);
    }

    return mapOrderResponse(order);
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    user: User,
  ) {
    await this.findOne(id, user);

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: updateOrderStatusDto.status },
      include: orderInclude,
    });

    await this.notificationService.sendOrderNotification(
      savedOrder.authorId,
      `notification_template_order_${updateOrderStatusDto.status.toLowerCase()}`,
      { orderId: savedOrder.id, status: savedOrder.status },
    );

    return this.emitUpdate(savedOrder);
  }

  async assignDriver(id: string, assignDriverDto: AssignDriverDto, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

    if (user.role === UserRole.MANAGER) {
      const managerZoneId = await this.managementService.validateManagerZoneAccess(user.id, order.vendor.zoneId);

      const driver = await this.prisma.user.findUnique({
        where: { id: assignDriverDto.driverId },
        select: { zoneId: true, role: true },
      });

      if (!driver || driver.role !== UserRole.DRIVER) {
        throw new NotFoundException('DRIVER_NOT_FOUND');
      }

      if (driver.zoneId !== managerZoneId) {
        throw new ForbiddenException('ACCESS_DENIED');
      }

      await this.prisma.managerAuditLog.create({
        data: {
          managerId: user.id,
          orderId: id,
          driverId: assignDriverDto.driverId,
          action: 'dispatch',
        },
      });
    }

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        driverId: assignDriverDto.driverId,
        status: OrderStatus.DRIVER_PENDING,
      },
      include: orderInclude,
    });

    return this.emitUpdate(savedOrder);
  }

  async rejectOrder(id: string, user: User) {
    const order = await this.findOne(id, user);
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

    if (order.driverId !== user.id) {
      throw new ForbiddenException('DRIVER_NOT_ASSIGNED');
    }

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        driverId: null,
        status: OrderStatus.DRIVER_REJECTED,
      },
      include: orderInclude,
    });

    return this.emitUpdate(savedOrder);
  }

  async getOrderReview(orderId: string, productId: string) {
    return this.reviewsService.findByOrderAndProduct(orderId, productId);
  }

  async vendorRejectOrder(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

    if (user.role === UserRole.VENDOR && order.vendor.authorId !== user.id) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    if (order.status !== OrderStatus.PLACED) {
      throw new BadRequestException('ORDER_NOT_PLACED');
    }

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.VENDOR_REJECTED },
      include: orderInclude,
    });

    await this.notificationService.sendOrderNotification(
      order.authorId,
      'notification_template_order_rejected',
      { orderId: savedOrder.id, status: savedOrder.status },
    );

    return this.emitUpdate(savedOrder);
  }


  async vendorAcceptOrder(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

    if (user.role === UserRole.VENDOR && order.vendor.authorId !== user.id) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    if (order.status !== OrderStatus.PLACED) {
      throw new BadRequestException('ORDER_NOT_PLACED');
    }

    if (order.vendorCommissionApplied) {
      throw new BadRequestException('COMMISSION_ALREADY_APPLIED');
    }

    return await this.prisma.$transaction(async (tx) => {
      const isFreePlan = await this.commissionService.isVendorOnFreePlan(order.vendorId);

      let vendorCommissionRate = 0;
      let vendorCommissionValue = 0;
      let vendorNet = Number(order.orderTotal);

      if (isFreePlan) {
        vendorCommissionRate = await this.commissionService.getVendorCommissionRate();
        const calculation = this.commissionService.calculateVendorCommission(
          Number(order.orderTotal),
          vendorCommissionRate,
        );
        vendorCommissionValue = calculation.value;
        vendorNet = Number(order.orderTotal) - vendorCommissionValue;

        await this.commissionService.createCommissionSnapshot(
          {
            orderId: id,
            vendorId: order.vendorId,
            source: CommissionSource.VENDOR,
            commissionRate: vendorCommissionRate,
            commissionValue: vendorCommissionValue,
            baseAmount: Number(order.orderTotal),
          },
          tx,
        );
      }

      const updateData: Prisma.OrderUpdateInput = {
        status: OrderStatus.VENDOR_ACCEPTED,
        vendorCommissionApplied: true,
        vendorCommissionRate,
        vendorCommissionValue,
        vendorNet,
      };

      if (order.driverCommissionApplied) {
        const platformTotal = vendorCommissionValue + Number(order.driverCommissionValue);
        updateData.platformTotalCommission = platformTotal;
      }

      const savedOrder = await tx.order.update({
        where: { id },
        data: updateData,
        include: orderInclude,
      });

      await this.notificationService.sendOrderNotification(
        order.authorId,
        'notification_template_order_accepted',
        { orderId: savedOrder.id, status: savedOrder.status },
      );

      return this.emitUpdate(savedOrder);
    });
  }

  async markOrderDelivered(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

    if (user.role === UserRole.DRIVER && order.driverId !== user.id) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    const validStatuses: OrderStatus[] = [
      OrderStatus.DRIVER_ACCEPTED,
      OrderStatus.SHIPPED,
      OrderStatus.IN_TRANSIT,
    ];
    if (!validStatuses.includes(order.status)) {
      throw new BadRequestException('INVALID_ORDER_STATUS');
    }

    if (order.driverCommissionApplied) {
      throw new BadRequestException('COMMISSION_ALREADY_APPLIED');
    }

    return await this.prisma.$transaction(async (tx) => {
      const driverCommissionRate = await this.commissionService.getDriverCommissionRate();
      const calculation = this.commissionService.calculateDriverCommission(
        Number(order.deliveryCharge),
        driverCommissionRate,
      );
      const driverCommissionValue = calculation.value;
      const driverNet = Number(order.deliveryCharge) - driverCommissionValue;

      await this.commissionService.createCommissionSnapshot(
        {
          orderId: id,
          driverId: order.driverId ?? undefined,
          source: CommissionSource.DRIVER,
          commissionRate: driverCommissionRate,
          commissionValue: driverCommissionValue,
          baseAmount: Number(order.deliveryCharge),
        },
        tx,
      );

      const platformTotal = Number(order.vendorCommissionValue) + driverCommissionValue;

      const savedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.COMPLETED,
          driverCommissionApplied: true,
          driverCommissionRate,
          driverCommissionValue,
          driverNet,
          platformTotalCommission: platformTotal,
        },
        include: orderInclude,
      });

      await this.notificationService.sendOrderNotification(
        order.authorId,
        'notification_template_order_completed',
        { orderId: savedOrder.id, status: savedOrder.status },
      );

      return this.emitUpdate(savedOrder);
    });
  }


  async acceptOrder(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

    if (order.driverId !== user.id) {
      throw new ForbiddenException('DRIVER_NOT_ASSIGNED');
    }

    if (order.status !== OrderStatus.DRIVER_PENDING) {
      throw new BadRequestException('ORDER_NOT_PENDING');
    }

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.DRIVER_ACCEPTED },
      include: orderInclude,
    });

    return this.emitUpdate(savedOrder);
  }

  async reportCashCollection(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

    if (order.driverId !== user.id) {
      throw new ForbiddenException('DRIVER_NOT_ASSIGNED');
    }

    if (order.paymentMethod !== PaymentMethod.cash) {
      throw new BadRequestException('NOT_COD_ORDER');
    }

    // Optional status check omitted for identical behavior as original

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { cashReportedAt: new Date() },
      include: orderInclude,
    });

    return this.emitUpdate(updatedOrder);
  }

  async confirmCashReceipt(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

    if (user.role !== UserRole.MANAGER) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    await this.managementService.validateManagerZoneAccess(user.id, order.vendor.zoneId);

    if (!order.cashReportedAt) {
      throw new BadRequestException('CASH_NOT_REPORTED');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('ORDER_ALREADY_PAID');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.managerCashConfirmation.create({
        data: {
          managerId: user.id,
          driverId: order.driverId!,
          orderId: id,
          amount: order.totalAmount,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id },
        data: { paymentStatus: PaymentStatus.PAID },
        include: orderInclude,
      });

      return this.emitUpdate(updatedOrder);
    });
  }

  async getManagerPendingCashOrders(user: User) {
    return this.managementService.getManagerPendingCashOrders(user);
  }

  async getManagerCashSummary(user: User, date: string) {
    return this.managementService.getManagerCashSummary(user, date);
  }

  async getDriverPendingCashOrders(driverId: string, user: User) {
    return this.managementService.getDriverPendingCashOrders(driverId, user);
  }

  async confirmManagerPayout(managerId: string, date: string, adminUser: User) {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const confirmations = await this.prisma.managerCashConfirmation.findMany({
      where: {
        managerId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (confirmations.length === 0) {
      throw new BadRequestException('NO_CASH_CONFIRMATIONS');
    }

    const totalAmount = confirmations.reduce((sum, conf) => sum + Number(conf.amount), 0);

    return this.prisma.managerPayoutConfirmation.create({
      data: {
        managerId,
        adminId: adminUser.id,
        amount: totalAmount,
        payoutDate: startOfDay,
      },
    });
  }

  // --- Private Helpers ---

  private async resolveProductsAndSubtotal(createOrderDto: CreateOrderDto) {
    const productIds = createOrderDto.products.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const subtotal = calculateSubtotal(createOrderDto.products, productMap);
    return { productMap, subtotal };
  }

  private async initializeOrderCalculations(createOrderDto: CreateOrderDto, subtotal: number) {
    return this.pricingService.calculatePricing(createOrderDto, subtotal);
  }

  private async finalizeOrderCreate(
    createOrderDto: CreateOrderDto,
    user: User,
    productMap: Map<string, any>,
    subtotal: number,
    calcs: any,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      if (createOrderDto.cashbackId) {
        await this.cashbackService.findOne(createOrderDto.cashbackId);
      }

      const savedOrder = await tx.order.create({
        data: {
          vendorId: createOrderDto.vendorId,
          authorId: user.id,
          items: {
            create: createOrderDto.products.map((item) => {
              const product = productMap.get(item.productId);
              if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');
              const price = product.discountPrice ? Number(product.discountPrice) : Number(product.price);
              return {
                productId: item.productId,
                quantity: item.quantity,
                price,
                extras: {
                  create: item.extras?.map((extra) => ({ name: extra.name, price: extra.price })),
                },
              };
            }),
          },
          totalAmount: calcs.totalAmount,
          status: OrderStatus.PLACED,
          addressId: calcs.address.id,
          paymentMethod: createOrderDto.paymentMethod,
          driverId: null,
          notes: createOrderDto.notes,
          deliveryCharge: createOrderDto.deliveryCharge,
          tipAmount: createOrderDto.tipAmount,
          takeAway: createOrderDto.takeAway || false,
          scheduleTime: createOrderDto.scheduleTime ? new Date(createOrderDto.scheduleTime) : null,
          orderSubtotal: subtotal,
          orderTotal: calcs.totalAmount,
          discountAmount: calcs.discountAmount,
          distanceInKm: calcs.distance,
          deliveryPricePerKm: calcs.deliveryPricePerKm,
          adminCommissionPercentage: calcs.adminCommissionPercentage,
          adminCommissionAmount: calcs.adminCommissionAmount,
          vendorEarnings: calcs.vendorEarnings,
        },
        include: orderInclude,
      });

      if (createOrderDto.paymentMethod === PaymentMethod.wallet) {
        await this.walletService.pay(
          user.id,
          calcs.totalAmount,
          `Payment for order at vendor ${createOrderDto.vendorId}`,
          savedOrder.id,
          tx,
        );
      }

      if (createOrderDto.cashbackId) {
        await this.cashbackService.redeem(user.id, {
          cashbackId: createOrderDto.cashbackId,
          orderId: savedOrder.id,
          amount: 5,
        });
      }

      // Notify vendor about new order placed
      const vendor = await tx.vendor.findUnique({
        where: { id: createOrderDto.vendorId },
        select: { authorId: true },
      });

      if (vendor?.authorId) {
        await this.notificationService.sendOrderNotification(
          vendor.authorId,
          'notification_template_order_placed',
          { orderId: savedOrder.id, status: savedOrder.status },
        );
      }

      return this.emitUpdate(savedOrder);
    });
  }

  private async buildSearchFilters(
    user: Pick<User, 'id' | 'role'>,
    query: { vendorId?: string; status?: OrderStatus | string },
  ) {
    const where: Prisma.OrderWhereInput = {};

    if (user.role === UserRole.CUSTOMER) {
      where.authorId = user.id;
    } else if (user.role === UserRole.VENDOR) {
      if (query.vendorId) where.vendorId = query.vendorId;
    } else if (user.role === UserRole.DRIVER) {
      where.driverId = user.id;
    } else if (user.role === UserRole.MANAGER) {
      const zoneId = await this.managementService.getManagerZoneId(user.id).catch(() => null);
      if (!zoneId) return null;
      where.vendor = { zoneId };
    }

    if (query.status) {
      where.status = query.status as OrderStatus;
    }
    return where;
  }

  async getCommissionReport(startDate?: Date, endDate?: Date) {
    return this.commissionService.getPlatformCommissionTotal(startDate, endDate);
  }

  async getVendorCommissionReport(vendorId: string, startDate?: Date, endDate?: Date) {
    return this.commissionService.getVendorNetReceivables(vendorId, startDate, endDate);
  }

  async getDriverCommissionReport(driverId: string, startDate?: Date, endDate?: Date) {
    return this.commissionService.getDriverEarnings(driverId, startDate, endDate);
  }

  async getMonthlyCommissionReport(year: number, month: number) {
    return this.commissionService.getMonthlyCommissionReport(year, month);
  }

  async getOrderCommissionSnapshots(orderId: string) {
    return this.commissionService.getOrderCommissionSnapshots(orderId);
  }



  private emitUpdate(order: any) {
    const mappedOrder = mapOrderResponse(order);
    if (mappedOrder) {
      this.ordersGateway.emitOrderUpdate(mappedOrder);
    }
    return mappedOrder;
  }
}

