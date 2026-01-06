import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
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
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersGateway } from './orders.gateway';
import {
  calculateDistance,
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

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });

    return orders.map((order) => mapOrderResponse(order));
  }

  async findOne(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (user.role === UserRole.CUSTOMER && order.authorId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === UserRole.MANAGER) {
      await this.validateManagerZoneAccess(user.id, order.vendor.zoneId);
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
      savedOrder.id,
      savedOrder.status,
    );

    return this.emitUpdate(savedOrder);
  }

  async assignDriver(id: string, assignDriverDto: AssignDriverDto, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (user.role === UserRole.MANAGER) {
      const managerZoneId = await this.validateManagerZoneAccess(user.id, order.vendor.zoneId);

      const driver = await this.prisma.user.findUnique({
        where: { id: assignDriverDto.driverId },
        select: { zoneId: true, role: true },
      });

      if (!driver || driver.role !== UserRole.DRIVER) {
        throw new NotFoundException('Driver not found');
      }

      if (driver.zoneId !== managerZoneId) {
        throw new ForbiddenException('Access denied: Driver outside your zone');
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
    if (!order) throw new NotFoundException('Order not found');

    if (order.driverId !== user.id) {
      throw new ForbiddenException('You are not assigned to this order');
    }

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        driverId: null,
        status: OrderStatus.ACCEPTED,
      },
      include: orderInclude,
    });

    return this.emitUpdate(savedOrder);
  }

  async getOrderReview(orderId: string, productId: string) {
    return this.reviewsService.findByOrderAndProduct(orderId, productId);
  }

  async acceptOrder(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.driverId !== user.id) {
      throw new ForbiddenException('You are not assigned to this order');
    }

    if (order.status !== OrderStatus.DRIVER_PENDING) {
      throw new BadRequestException('Order is not in pending state');
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

    if (!order) throw new NotFoundException('Order not found');

    if (order.driverId !== user.id) {
      throw new ForbiddenException('You are not the driver for this order');
    }

    if (order.paymentMethod !== PaymentMethod.cash) {
      throw new BadRequestException('This order is not a COD order');
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

    if (!order) throw new NotFoundException('Order not found');

    if (user.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Access denied');
    }

    await this.validateManagerZoneAccess(user.id, order.vendor.zoneId);

    if (!order.cashReportedAt) {
      throw new BadRequestException('Driver has not reported cash collection yet');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already marked as paid');
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
    if (user.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Access denied');
    }

    const zoneId = await this.getManagerZoneId(user.id);

    const orders = await this.prisma.order.findMany({
      where: {
        paymentMethod: PaymentMethod.cash,
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.UNPAID,
        vendor: { zoneId },
      },
      include: orderInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return orders.map((order) => mapOrderResponse(order));
  }

  async getManagerCashSummary(user: User, date: string) {
    if (user.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Access denied');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const confirmations = await this.prisma.managerCashConfirmation.findMany({
      where: {
        managerId: user.id,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const totalCash = confirmations.reduce((sum, conf) => sum + Number(conf.amount), 0);

    return {
      date,
      totalOrders: confirmations.length,
      totalCash,
    };
  }

  async getDriverPendingCashOrders(driverId: string, user: User) {
    if (user.role === UserRole.DRIVER && user.id !== driverId) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === UserRole.MANAGER) {
      const managerZoneId = await this.getManagerZoneId(user.id);
      const driver = await this.prisma.user.findUnique({
        where: { id: driverId },
        select: { zoneId: true },
      });
      if (driver?.zoneId !== managerZoneId) {
        throw new ForbiddenException('Access denied: Driver outside your zone');
      }
    }

    const orders = await this.prisma.order.findMany({
      where: {
        driverId: driverId,
        paymentMethod: PaymentMethod.cash,
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.UNPAID,
      },
      include: orderInclude,
      orderBy: { updatedAt: 'desc' },
    });

    const totalCash = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    return {
      driverId,
      totalOrders: orders.length,
      totalCash,
      orders: orders.map((order) => mapOrderResponse(order)),
    };
  }

  async confirmManagerPayout(managerId: string, date: string, adminUser: User) {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
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
      throw new BadRequestException('No cash confirmations found for this manager on this date');
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
    const settings = await this.prisma.setting.findMany({
      where: { key: { in: ['admin_commission_percentage', 'delivery_price_per_km'] } },
    });

    const commissionPercentSetting = Number(settings.find((s) => s.key === 'admin_commission_percentage')?.value || 0);
    const deliveryPricePerKm = Number(settings.find((s) => s.key === 'delivery_price_per_km')?.value || 0);

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: createOrderDto.vendorId },
      include: { subscriptionPlan: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const address = await this.prisma.address.findUnique({ where: { id: createOrderDto.addressId } });
    if (!address) throw new NotFoundException('Delivery address not found');

    const distance = calculateDistance(
      Number(vendor.latitude),
      Number(vendor.longitude),
      Number(address.latitude),
      Number(address.longitude),
    );

    const deliveryCharge = distance * deliveryPricePerKm;
    createOrderDto.deliveryCharge = deliveryCharge;

    let adminCommissionPercentage = 0;
    if (vendor.subscriptionPlan && Number(vendor.subscriptionPlan.price.toString()) === 0) {
      adminCommissionPercentage = commissionPercentSetting;
    }

    const adminCommissionAmount = subtotal * (adminCommissionPercentage / 100);
    let discountAmount = 0;
    if (createOrderDto.couponCode) {
      const couponResult = await this.couponsService.validate(
        createOrderDto.couponCode,
        createOrderDto.vendorId,
        subtotal,
      );
      discountAmount = couponResult.discountValue;
    }

    const vendorEarnings = subtotal - adminCommissionAmount - discountAmount;
    let totalAmount = subtotal - (discountAmount + (createOrderDto.deliveryCharge || 0) + (createOrderDto.tipAmount || 0));
    totalAmount = Math.max(totalAmount, 0);

    return {
      vendor,
      address,
      distance,
      deliveryPricePerKm,
      adminCommissionPercentage,
      adminCommissionAmount,
      discountAmount,
      vendorEarnings,
      totalAmount,
      deliveryCharge,
    };
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
              if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
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

      await this.notificationService.sendVendorNotification(
        createOrderDto.vendorId,
        'notification_template_order_placed',
        savedOrder.id,
        savedOrder.status,
      );

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
      const zoneId = await this.getManagerZoneId(user.id).catch(() => null);
      if (!zoneId) return null;
      where.vendor = { zoneId };
    }

    if (query.status) {
      where.status = query.status as OrderStatus;
    }
    return where;
  }

  private async getManagerZoneId(managerId: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { zoneId: true },
    });
    if (!manager?.zoneId) {
      throw new ForbiddenException('Manager has no assigned zone');
    }
    return manager.zoneId;
  }

  private async validateManagerZoneAccess(managerId: string, vendorZoneId: string | null) {
    const zoneId = await this.getManagerZoneId(managerId);
    if (vendorZoneId !== zoneId) {
      throw new ForbiddenException('Access denied: Order outside your zone');
    }
    return zoneId;
  }

  private emitUpdate(order: any) {
    const mappedOrder = mapOrderResponse(order);
    if (mappedOrder) {
      this.ordersGateway.emitOrderUpdate(mappedOrder);
    }
    return mappedOrder;
  }
}

