import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BalanceType,
  CommissionSource,
  DeliveryConfirmationType,
  HeldBalanceStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  TransactionType,
  User,
  UserRole,
} from '@prisma/client';

import { RedisService } from '../../shared/services/redis.service';

import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../shared/services/notification.service';
import { AnalyticsTrackingService } from '../analytics/analytics-tracking.service';
import { CashbackService } from '../cashback/cashback.service';
import { CouponsService } from '../coupons/coupons.service';
import { ProductsService } from '../products/products.service';
import { ReviewsService } from '../reviews/reviews.service';
import { APP_SETTINGS } from '../settings/settings.constants';
import { SettingsService } from '../settings/settings.service';
import { WalletProtectionService } from '../wallet/wallet-protection.service';
import { WalletTransactionDescriptions } from '../wallet/wallet-transaction.constants';
import { WalletService } from '../wallet/wallet.service';
import { CommissionService } from './commission.service';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { DriverReportProblemDto } from './dto/driver-report-problem.dto';
import { MarkOrderDeliveredDto } from './dto/mark-order-delivered.dto';
import { VendorAcceptOrderDto } from './dto/vendor-accept-order.dto';
import { OrderManagementService } from './order-management.service';
import { OrderPricingService } from './order-pricing.service';
import {
  AnalyticsEventType,
  NotificationEventType,
  OrderConstants,
  ORDERS_ERRORS,
  ORDERS_NOTIFICATIONS,
} from './orders.constants';
import { OrdersGateway } from './orders.gateway';
import {
  calculateSubtotal,
  mapOrderResponse,
  orderInclude,
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
    private walletProtectionService: WalletProtectionService,
    private settingsService: SettingsService,
    private reviewsService: ReviewsService,
    private ordersGateway: OrdersGateway,
    private notificationService: NotificationService,
    private redisService: RedisService,
    private pricingService: OrderPricingService,
    private managementService: OrderManagementService,
    private commissionService: CommissionService,
    private analyticsTrackingService: AnalyticsTrackingService,
    private i18n: I18nService,
  ) { }

  async create(createOrderDto: CreateOrderDto, user: User) {
    const { productMap, subtotal } =
      await this.resolveProductsAndSubtotal(createOrderDto);

    const calculations = await this.pricingService.calculatePricing(
      createOrderDto,
      subtotal,
      user.id,
    );

    const result = await this.finalizeOrderCreate(
      createOrderDto,
      user,
      productMap,
      subtotal,
      calculations,
    );

    // Track Order Created
    if (result) {
      this.analyticsTrackingService.trackOrderLifecycle({
        orderId: result.id,
        eventType: AnalyticsEventType.ORDER_CREATED,
        previousStatus: undefined,
        newStatus: OrderStatus.PLACED,
        actorId: user.id,
        actorRole: user.role,
        metadata: {
          totalAmount: Number(result.orderTotal),
          vendorId: result.vendorId,
          itemsCount: result.products?.length || 0,
        },
      });
    }

    return result;
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
      throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);
    }

    if (user.role === UserRole.CUSTOMER && order.authorId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
    }

    if (user.role === UserRole.VENDOR && order.vendor?.authorId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
    }

    if (user.role === UserRole.DRIVER && order.driverId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
    }

    if (user.role === UserRole.MANAGER) {
      await this.managementService.validateManagerZoneAccess(
        user.id,
        order.vendor.zoneId,
      );
    }

    return mapOrderResponse(order);
  }

  async cancelOrder(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    // Reuse findOne's ownership checks indirectly or implement explicitly
    const orderDetails = await this.findOne(id, user);

    const invalidStatuses: OrderStatus[] = [
      OrderStatus.COMPLETED,
      OrderStatus.SHIPPED,
      OrderStatus.IN_TRANSIT,
      OrderStatus.CANCELLED,
    ];

    if (invalidStatuses.includes(order.status)) {
      throw new BadRequestException(ORDERS_ERRORS.ORDER_CANNOT_BE_CANCELLED);
    }

    const savedOrder = await this.processOrderCancellation(
      id,
      user,
      WalletTransactionDescriptions.orderCancelledByUser().en,
    );

    await this.notificationService.sendOrderNotification(
      savedOrder.authorId,
      ORDERS_NOTIFICATIONS.ORDER_CANCELLED,
      { orderId: savedOrder.id, status: savedOrder.status },
    );

    return this.emitUpdate(savedOrder);
  }

  async reportDeliveryProblem(
    id: string,
    dto: DriverReportProblemDto,
    user: User,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    // Only the assigned driver can report a problem during delivery
    if (order.driverId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.NOT_ASSIGNED_TO_THIS_ORDER);
    }

    const validStatuses: OrderStatus[] = [
      OrderStatus.DRIVER_ACCEPTED,
      OrderStatus.SHIPPED,
      OrderStatus.IN_TRANSIT,
    ];

    if (!validStatuses.includes(order.status)) {
      throw new BadRequestException(
        ORDERS_ERRORS.CANNOT_REPORT_PROBLEM_IN_CURRENT_STATUS,
      );
    }

    const savedOrder = await this.processOrderCancellation(
      id,
      user,
      `Delivery reported problem: ${dto.reason}`,
      AnalyticsEventType.DELIVERY_FAILED,
    );

    // Notifications
    await this.notificationService.sendOrderNotification(
      savedOrder.authorId,
      ORDERS_NOTIFICATIONS.ORDER_FAILED_DELIVERY,
      { orderId: savedOrder.id, reason: dto.reason },
    );

    await this.notificationService.sendOrderNotification(
      order.vendor.authorId,
      ORDERS_NOTIFICATIONS.ORDER_FAILED_DELIVERY_VENDOR,
      { orderId: savedOrder.id, reason: dto.reason },
    );

    if (order.vendor.zoneId) {
      const managers = await this.prisma.user.findMany({
        where: { role: UserRole.MANAGER, zoneId: order.vendor.zoneId },
      });

      for (const manager of managers) {
        const titleEn = await this.i18n.translate(
          'messages.DELIVERY_ISSUE_TITLE',
          { lang: 'en' },
        );
        const titleAr = await this.i18n.translate(
          'messages.DELIVERY_ISSUE_TITLE',
          { lang: 'ar' },
        );
        const bodyEn = await this.i18n.translate(
          'messages.DELIVERY_ISSUE_BODY',
          {
            lang: 'en',
            args: { orderId: savedOrder.id, reason: dto.reason },
          },
        );
        const bodyAr = await this.i18n.translate(
          'messages.DELIVERY_ISSUE_BODY',
          {
            lang: 'ar',
            args: { orderId: savedOrder.id, reason: dto.reason },
          },
        );

        await this.notificationService.sendCustomNotification(
          [manager.id],
          { en: titleEn, ar: titleAr },
          { en: bodyEn, ar: bodyAr },
          {
            orderId: savedOrder.id,
            type: NotificationEventType.DELIVERY_ISSUE,
          },
        );
      }
    }

    return this.emitUpdate(savedOrder);
  }

  async assignDriver(id: string, assignDriverDto: AssignDriverDto, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    const invalidStatuses: OrderStatus[] = [
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ];

    if (invalidStatuses.includes(order.status)) {
      throw new BadRequestException(
        ORDERS_ERRORS.CANNOT_ASSIGN_DRIVER_TO_CLOSED_ORDER,
      );
    }

    if (user.role === UserRole.VENDOR && order.vendor?.authorId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
    }

    if (user.role === UserRole.MANAGER) {
      const managerZoneId =
        await this.managementService.validateManagerZoneAccess(
          user.id,
          order.vendor.zoneId,
        );

      const driver = await this.prisma.user.findUnique({
        where: { id: assignDriverDto.driverId },
        select: {
          zoneId: true,
          role: true,
          driverProfile: {
            select: { walletAmount: true },
          },
        },
      });

      if (!driver || driver.role !== UserRole.DRIVER) {
        throw new NotFoundException(ORDERS_ERRORS.DRIVER_NOT_FOUND);
      }

      if (driver.zoneId !== managerZoneId) {
        throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
      }

      // --- RISK 7.4: PROFILE VALIDATION ---
      if (!driver.driverProfile) {
        throw new BadRequestException(
          ORDERS_ERRORS.DRIVER_PROFILE_NOT_INITIALIZED,
        );
      }

      // --- RISK 7.2: CONCURRENCY LOCK ---
      const lockKey = `${OrderConstants.REDIS_LOCK_ASSIGN_ORDER_PREFIX}${assignDriverDto.driverId}`;
      const client = this.redisService.getClient();
      // Only lock if redis is connected
      if (client) {
        const lock = await client.set(lockKey, 'true', { NX: true, EX: 10 });
        if (!lock) {
          throw new ConflictException(
            ORDERS_ERRORS.DRIVER_IS_BEING_ASSIGNED_ANOTHER_ORDER,
          );
        }
      }

      try {
        // --- DEBT LIMIT CHECK ---
        const maxDebt = await this.commissionService.getMaxDriverDebt();
        const currentBalance = Number(driver.driverProfile.walletAmount || 0);

        // Note: Debt is represented by a negative balance in the driverProfile.walletAmount.
        const currentDebt = currentBalance < 0 ? Math.abs(currentBalance) : 0;

        let expectedNewDebt = 0;
        if (order.paymentMethod === PaymentMethod.cash) {
          // Debt only includes Subtotal + Fee. Driver keeps the tip.
          expectedNewDebt = Number(order.totalAmount) - Number(order.tipAmount);
        }

        if (currentDebt + expectedNewDebt > maxDebt) {
          throw new BadRequestException(ORDERS_ERRORS.DRIVER_MAX_DEBT_EXCEEDED);
        }
      } finally {
        if (client) {
          await client.del(lockKey);
        }
      }
      // -------------------------

      await this.prisma.managerAuditLog.create({
        data: {
          managerId: user.id,
          orderId: id,
          driverId: assignDriverDto.driverId,
          action: OrderConstants.MANAGER_AUDIT_ACTION_DISPATCH,
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

    // Track Driver Assignment
    this.analyticsTrackingService.trackOrderLifecycle({
      orderId: savedOrder.id,
      eventType: AnalyticsEventType.DRIVER_ASSIGNED,
      previousStatus: order.status,
      newStatus: OrderStatus.DRIVER_PENDING,
      actorId: user.id,
      actorRole: user.role,
      metadata: {
        driverId: assignDriverDto.driverId,
      },
    });

    return this.emitUpdate(savedOrder);
  }

  async rejectOrder(id: string, user: User) {
    const order = await this.findOne(id, user);
    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    if (order.driverId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.DRIVER_NOT_ASSIGNED);
    }

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        driverId: null,
        status: OrderStatus.DRIVER_REJECTED,
      },
      include: { ...orderInclude, vendor: true },
    });

    // Track Driver Rejection
    this.analyticsTrackingService.trackOrderLifecycle({
      orderId: savedOrder.id,
      eventType: AnalyticsEventType.DRIVER_REJECTED,
      previousStatus: order.status,
      newStatus: OrderStatus.DRIVER_REJECTED,
      actorId: user.id,
      actorRole: user.role,
    });

    // Notify managers in the same zone
    if (savedOrder.vendor?.zoneId) {
      const managers = await this.prisma.user.findMany({
        where: {
          role: UserRole.MANAGER,
          zoneId: savedOrder.vendor.zoneId,
          isActive: true,
          fcmToken: { not: null },
        },
        select: { id: true },
      });

      const managerIds = managers.map((m) => m.id);
      if (managerIds.length > 0) {
        await this.notificationService.sendBulkNotifications(
          managerIds,
          ORDERS_NOTIFICATIONS.MANAGER_DRIVER_REJECTED,
          {
            orderId: savedOrder.id,
            vendorName: savedOrder.vendor.title,
            driverName: `${user.firstName} ${user.lastName}`,
            status: 'DRIVER_REJECTED',
          },
        );
      }
    }

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

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    if (user.role === UserRole.VENDOR && order.vendor.authorId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
    }

    if (order.status !== OrderStatus.PLACED) {
      throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_PLACED);
    }

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.VENDOR_REJECTED },
      include: orderInclude,
    });

    // Track Vendor Rejection
    this.analyticsTrackingService.trackOrderLifecycle({
      orderId: savedOrder.id,
      eventType: AnalyticsEventType.VENDOR_REJECTED,
      previousStatus: OrderStatus.PLACED,
      newStatus: OrderStatus.VENDOR_REJECTED,
      actorId: user.id,
      actorRole: user.role,
    });

    await this.notificationService.sendOrderNotification(
      order.authorId,
      ORDERS_NOTIFICATIONS.ORDER_REJECTED,
      { orderId: savedOrder.id, status: savedOrder.status },
    );

    return this.emitUpdate(savedOrder);
  }

  async vendorAcceptOrder(id: string, user: User, dto?: VendorAcceptOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: { include: { subscriptionPlan: true } } },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    if (user.role === UserRole.VENDOR && order.vendor.authorId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
    }

    // Check subscription order limit for paid plans (totalOrders -1 means unlimited)
    const plan = order.vendor.subscriptionPlan;
    if (plan && Number(plan.price) !== 0 && plan.totalOrders !== -1) {
      const remainingOrders = order.vendor.subscriptionTotalOrders ?? 0;
      if (remainingOrders <= 0) {
        throw new BadRequestException(
          ORDERS_ERRORS.SUBSCRIPTION_ORDER_LIMIT_REACHED,
        );
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction for thread safety
      const currentOrder = await tx.order.findUnique({
        where: { id },
        select: { status: true, vendorCommissionApplied: true },
      });

      if (!currentOrder)
        throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);
      if (currentOrder.status !== OrderStatus.PLACED)
        throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_PLACED);
      if (currentOrder.vendorCommissionApplied)
        throw new BadRequestException(ORDERS_ERRORS.COMMISSION_ALREADY_APPLIED);

      // Decrement subscription orders for paid plans
      if (plan && Number(plan.price) !== 0) {
        await tx.vendor.update({
          where: { id: order.vendorId },
          data: { subscriptionTotalOrders: { decrement: 1 } },
        });
      }

      const isFreePlan = await this.commissionService.isVendorOnFreePlan(
        order.vendorId,
      );

      let vendorCommissionRate = 0;
      let vendorCommissionValue = 0;
      let vendorNet = Number(order.orderTotal);

      if (isFreePlan) {
        vendorCommissionRate =
          await this.commissionService.getVendorCommissionRate();
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

      // Calculate estimated completion time if preparation time is provided
      // Calculate estimated completion time if preparation time is provided
      let estimatedReadyAt: Date | undefined;
      if (dto?.preparationTime) {
        const now = new Date();
        estimatedReadyAt = new Date(
          now.getTime() + dto.preparationTime * 60000,
        );
      }

      const updateData: Prisma.OrderUpdateInput = {
        status: OrderStatus.VENDOR_ACCEPTED,
        vendorCommissionApplied: true,
        vendorCommissionRate,
        vendorCommissionValue,
        vendorNet,
        estimatedReadyAt,
        isReadyNotificationSent: false,
      };

      if (order.driverCommissionApplied) {
        const platformTotal =
          vendorCommissionValue + Number(order.driverCommissionValue);
        updateData.platformTotalCommission = platformTotal;
      }

      const savedOrder = await tx.order.update({
        where: { id },
        data: updateData,
        include: orderInclude,
      });

      // Track Vendor Acceptance
      this.analyticsTrackingService.trackOrderLifecycle({
        orderId: savedOrder.id,
        eventType: AnalyticsEventType.VENDOR_ACCEPTED,
        previousStatus: OrderStatus.PLACED,
        newStatus: OrderStatus.VENDOR_ACCEPTED,
        actorId: user.id,
        actorRole: user.role,
        metadata: {
          preparationTime: dto?.preparationTime,
          estimatedReadyAt: estimatedReadyAt,
        },
      });

      await this.notificationService.sendOrderNotification(
        order.authorId,
        ORDERS_NOTIFICATIONS.ORDER_ACCEPTED,
        { orderId: savedOrder.id, status: savedOrder.status },
      );

      return this.emitUpdate(savedOrder);
    });
  }

  async markOrderDelivered(id: string, user: User, dto?: MarkOrderDeliveredDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    if (user.role === UserRole.DRIVER && order.driverId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
    }

    // OTP validation for wallet orders
    if (order.paymentMethod === PaymentMethod.wallet) {
      if (!dto?.otp) {
        throw new BadRequestException('OTP_REQUIRED');
      }
      if (order.deliveryOtp !== dto.otp) {
        throw new BadRequestException(ORDERS_ERRORS.INVALID_DELIVERY_OTP);
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction for thread safety
      const currentOrder = await tx.order.findUnique({
        where: { id },
        select: {
          status: true,
          driverCommissionApplied: true,
          totalAmount: true,
          paymentMethod: true,
          driverId: true,
        },
      });

      if (!currentOrder)
        throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

      const validStatuses: OrderStatus[] = [
        OrderStatus.DRIVER_ACCEPTED,
        OrderStatus.SHIPPED,
        OrderStatus.IN_TRANSIT,
      ];
      if (!validStatuses.includes(currentOrder.status)) {
        throw new BadRequestException(ORDERS_ERRORS.INVALID_ORDER_STATUS);
      }

      const savedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.COMPLETED,
        },
        include: orderInclude,
      });

      // --- WALLET UPDATES FOR CASH ON DELIVERY ---
      // For COD, credits happen at DELIVERY when money is physically collected.
      if (currentOrder.paymentMethod === PaymentMethod.cash) {
        // 1. Vendor Earnings
        await this.walletService.addVendorEarnings(
          order.vendorId,
          order.vendor.authorId,
          Number(savedOrder.vendorNet),
          savedOrder.id,
          tx,
        );

        // 2. Driver Earnings (Pay from distance portion ONLY)
        // Note: For COD, tips are kept by the driver in hand, so they are not digitally credited.
        await this.walletService.addDriverEarnings(
          currentOrder.driverId!,
          Number(savedOrder.driverNet),
          savedOrder.id,
          tx,
        );

        // 3. Admin Wallet (Total Commission)
        await this.walletService.addAdminCommission(
          Number(savedOrder.platformTotalCommission),
          savedOrder.id,
          tx,
        );

        // 4. Record Driver Debt (Cash to return: Subtotal + Fee, excluding Tip)
        const amountToCollect =
          Number(order.totalAmount) - Number(order.tipAmount);
        await tx.walletTransaction.create({
          data: {
            userId: currentOrder.driverId!,
            amount: amountToCollect,
            type: TransactionType.PAYMENT, // Record cash collection as a debt
            descriptionEn: WalletTransactionDescriptions.cashCollectedDebt(
              savedOrder.id,
            ).en,
            descriptionAr: WalletTransactionDescriptions.cashCollectedDebt(
              savedOrder.id,
            ).ar,
            orderId: savedOrder.id,
            transactionUser: OrderConstants.DRIVER_TRANSACTION_USER,
          },
        });
        await this.walletService.updateDriverWallet(
          currentOrder.driverId!,
          amountToCollect,
          OrderConstants.WALLET_OPERATION_SUBTRACT,
          tx,
        );
      }

      // --- WALLET PROTECTION: For wallet payments, funds remain HELD ---
      // Driver has marked order as delivered, but funds are NOT released
      // Customer must confirm delivery OR wait for auto-release timeout
      if (currentOrder.paymentMethod === PaymentMethod.wallet) {
        // Send notification requesting delivery confirmation
        await this.notificationService.sendOrderNotification(
          order.authorId,
          ORDERS_NOTIFICATIONS.CONFIRM_DELIVERY,
          {
            orderId: savedOrder.id,
            status: savedOrder.status,
            message: WalletTransactionDescriptions.deliveryConfirmedReason().en,
          },
        );
      } else {
        // COD: Send regular completion notification
        await this.notificationService.sendOrderNotification(
          order.authorId,
          ORDERS_NOTIFICATIONS.ORDER_COMPLETED,
          { orderId: savedOrder.id, status: savedOrder.status },
        );
      }

      // Track Order Delivered
      this.analyticsTrackingService.trackOrderLifecycle({
        orderId: savedOrder.id,
        eventType: AnalyticsEventType.ORDER_DELIVERED,
        previousStatus: order.status,
        newStatus: OrderStatus.COMPLETED,
        actorId: user.id,
        actorRole: user.role,
        metadata: {
          driverCommission: savedOrder.driverCommissionValue,
          deliveryTime: new Date().getTime() - order.createdAt.getTime(),
        },
      });

      // Also track delivery event
      this.analyticsTrackingService.trackDeliveryEvent({
        orderId: savedOrder.id,
        driverId: user.id,
        vendorId: order.vendorId,
        eventType: 'DELIVERED',
        status: 'COMPLETED',
        latitude: 0, // Should be passed from client ideally
        longitude: 0,
      });

      return this.emitUpdate(savedOrder);
    });
  }

  async acceptOrder(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    if (order.driverId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.DRIVER_NOT_ASSIGNED);
    }

    if (order.status !== OrderStatus.DRIVER_PENDING) {
      throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_PENDING);
    }

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.DRIVER_ACCEPTED },
      include: { ...orderInclude, vendor: true },
    });

    // Notify managers in the same zone
    if (savedOrder.vendor?.zoneId) {
      const managers = await this.prisma.user.findMany({
        where: {
          role: UserRole.MANAGER,
          zoneId: savedOrder.vendor.zoneId,
          isActive: true,
          fcmToken: { not: null },
        },
        select: { id: true },
      });

      const managerIds = managers.map((m) => m.id);
      if (managerIds.length > 0) {
        await this.notificationService.sendBulkNotifications(
          managerIds,
          ORDERS_NOTIFICATIONS.MANAGER_DRIVER_ACCEPTED,
          {
            orderId: savedOrder.id,
            vendorName: savedOrder.vendor.title,
            driverName: `${user.firstName} ${user.lastName}`,
            status: 'DRIVER_ACCEPTED',
          },
        );
      }
    }

    return this.emitUpdate(savedOrder);
  }

  async confirmPickup(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    if (order.driverId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.DRIVER_NOT_ASSIGNED);
    }

    // Order must be marked as accepted by driver before it can be picked up
    if (order.status !== OrderStatus.DRIVER_ACCEPTED) {
      throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_ACCEPTED_BY_DRIVER);
    }

    // --- READINESS CHECK ---
    if (order.estimatedReadyAt && new Date() < order.estimatedReadyAt) {
      throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_READY_YET);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Calculate Driver Pay & Admin Cut from Delivery Fee
      const driverCommRate =
        await this.commissionService.getDriverCommissionRate();
      const minPay = await this.commissionService.getMinDeliveryPay();

      const deliveryCharge = Number(order.deliveryCharge);
      // Admin Cut = % of delivery charge
      const adminDeliveryCut =
        Math.round(deliveryCharge * (driverCommRate / 100) * 100) / 100;

      // Driver Pay = Fee - Admin Cut, but subject to floor (min_delivery_pay)
      // If floor is applied, Admin takes less.
      // --- RISK 7.1: SUBSIDY PROTECTION ---
      const driverNet = Math.max(
        Math.min(deliveryCharge, deliveryCharge - adminDeliveryCut),
        minPay,
      );

      // Admin cut is the remainder. It should never be negative unless deliberate subsidy.
      const driverCommissionValue = Math.max(0, deliveryCharge - driverNet);

      await this.commissionService.createCommissionSnapshot(
        {
          orderId: id,
          driverId: order.driverId ?? undefined,
          source: CommissionSource.DRIVER,
          commissionRate: driverCommRate,
          commissionValue: driverCommissionValue, // Platform's cut
          baseAmount: deliveryCharge,
        },
        tx,
      );

      const platformTotal =
        Number(order.vendorCommissionValue) + driverCommissionValue;

      // 2. Generate Delivery OTP for secure confirmation
      const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Update Order Status and metrics
      const savedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.SHIPPED,
          driverCommissionApplied: true,
          driverCommissionRate: driverCommRate,
          driverCommissionValue, // Platform's cut
          driverNet, // Driver pay portion
          platformTotalCommission: platformTotal,
          deliveryOtp,
        },
        include: orderInclude,
      });

      // 3. Handle Wallet Transfers
      if (order.paymentMethod === PaymentMethod.wallet) {
        // *** WALLET PROTECTION: DO NOT release funds here ***
        // Funds remain HELD until customer confirms delivery or timeout

        // Update HeldBalance with calculated amounts and driver info
        const driverTotal =
          Number(savedOrder.driverNet) + Number(savedOrder.tipAmount);
        await tx.heldBalance.update({
          where: { orderId: order.id },
          data: {
            driverId: order.driverId,
            vendorAmount: Number(savedOrder.vendorNet),
            driverAmount: driverTotal,
            adminAmount: platformTotal,
            // Recalculate auto-release date from shipping
            autoReleaseDate: (() => {
              const date = new Date();
              date.setDate(date.getDate() + 7); // 7 days from shipped
              return date;
            })(),
          },
        });
      }

      // Track in Analytics
      this.analyticsTrackingService.trackOrderLifecycle({
        orderId: savedOrder.id,
        eventType: AnalyticsEventType.ORDER_PICKED_UP,
        previousStatus: OrderStatus.DRIVER_ACCEPTED,
        newStatus: OrderStatus.SHIPPED,
        actorId: user.id,
        actorRole: UserRole.DRIVER,
        metadata: {
          driverId: user.id,
          vendorId: order.vendorId,
          pickupTime: new Date(),
        },
      });

      await this.notificationService.sendOrderNotification(
        order.authorId,
        ORDERS_NOTIFICATIONS.ORDER_SHIPPED,
        {
          orderId: savedOrder.id,
          vendorName: order.vendor.title,
          status: savedOrder.status,
        },
      );

      return this.emitUpdate(savedOrder);
    });
  }

  async reportCashCollection(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    if (order.driverId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.DRIVER_NOT_ASSIGNED);
    }

    if (order.paymentMethod !== PaymentMethod.cash) {
      throw new BadRequestException(ORDERS_ERRORS.NOT_COD_ORDER);
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

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    if (user.role !== UserRole.MANAGER) {
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
    }

    await this.managementService.validateManagerZoneAccess(
      user.id,
      order.vendor.zoneId,
    );

    if (!order.cashReportedAt) {
      throw new BadRequestException(ORDERS_ERRORS.CASH_NOT_REPORTED);
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(ORDERS_ERRORS.ORDER_ALREADY_PAID);
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

      // When manager confirms receipt, we "clear" the driver's cash debt
      const cashHandoverDescriptions =
        WalletTransactionDescriptions.cashHandover(id);
      await this.prisma.walletTransaction.create({
        data: {
          userId: order.driverId!,
          amount: Number(order.totalAmount),
          type: TransactionType.DEPOSIT, // Cash handover is treated as a deposit from the driver
          descriptionEn: cashHandoverDescriptions.en,
          descriptionAr: cashHandoverDescriptions.ar,
          orderId: id,
          transactionUser: OrderConstants.DRIVER_TRANSACTION_USER,
        },
      });
      await this.walletService.updateDriverWallet(
        order.driverId!,
        Number(order.totalAmount),
        OrderConstants.WALLET_OPERATION_ADD,
        tx,
      );

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
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
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
      throw new BadRequestException(ORDERS_ERRORS.NO_CASH_CONFIRMATIONS);
    }

    const totalAmount = confirmations.reduce(
      (sum, conf) => sum + Number(conf.amount),
      0,
    );

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

  private async initializeOrderCalculations(
    createOrderDto: CreateOrderDto,
    subtotal: number,
  ) {
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
              if (!product)
                throw new NotFoundException(ORDERS_ERRORS.PRODUCT_NOT_FOUND);
              const price = product.discountPrice
                ? Number(product.discountPrice)
                : Number(product.price);
              return {
                productId: item.productId,
                quantity: item.quantity,
                price,
                extras: {
                  create: item.extras?.map((extra) => ({
                    name: extra.name,
                    price: extra.price,
                  })),
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
          deliveryCharge: calcs.deliveryCharge,
          tipAmount: createOrderDto.tipAmount,
          takeAway: createOrderDto.takeAway || false,
          scheduleTime: createOrderDto.scheduleTime
            ? new Date(createOrderDto.scheduleTime)
            : null,
          orderSubtotal: subtotal,
          orderTotal: calcs.totalAmount,
          discountAmount: calcs.discountAmount,
          distanceInKm: calcs.distance,
          deliveryPricePerKm: 0,
          adminCommissionPercentage: calcs.adminCommissionPercentage,
          adminCommissionAmount: calcs.adminCommissionAmount,
          vendorEarnings: calcs.vendorEarnings,
        },
        include: orderInclude,
      });

      if (createOrderDto.paymentMethod === PaymentMethod.wallet) {
        // Step 1: Deduct from customer wallet (funds are HELD, not released)
        await tx.walletTransaction.create({
          data: {
            userId: user.id,
            amount: calcs.totalAmount,
            type: TransactionType.PAYMENT,
            descriptionEn: WalletTransactionDescriptions.orderPaymentHeld(
              savedOrder.id,
            ).en,
            descriptionAr: WalletTransactionDescriptions.orderPaymentHeld(
              savedOrder.id,
            ).ar,
            orderId: savedOrder.id,
            transactionUser: OrderConstants.CUSTOMER_TRANSACTION_USER,
            balanceType: BalanceType.HELD,
          },
        });

        // Deduct from customer available balance
        await this.walletService.updateUserWallet(
          user.id,
          calcs.totalAmount,
          OrderConstants.WALLET_OPERATION_SUBTRACT,
          tx,
        );

        // Step 2: Create HeldBalance record
        const autoReleaseDays = await this.settingsService
          .findOne(APP_SETTINGS.WALLET_AUTO_RELEASE_DAYS)
          .catch(() => '7');
        const autoReleaseDate = new Date();
        autoReleaseDate.setDate(
          autoReleaseDate.getDate() + parseInt(autoReleaseDays || '7'),
        );

        await tx.heldBalance.create({
          data: {
            orderId: savedOrder.id,
            customerId: user.id,
            vendorId: createOrderDto.vendorId,
            driverId: null, // Will be set when driver is assigned
            totalAmount: calcs.totalAmount,
            vendorAmount: calcs.vendorEarnings || 0, // Initial estimate
            driverAmount: 0, // Calculated at SHIPPED
            adminAmount: calcs.adminCommissionAmount || 0, // Initial estimate
            status: HeldBalanceStatus.HELD,
            holdReason:
              OrderConstants.HELD_BALANCE_REASON_AWAITING_CONFIRMATION,
            autoReleaseDate,
          },
        });

        // Update order status to paid (but funds are HELD)
        await tx.order.update({
          where: { id: savedOrder.id },
          data: { paymentStatus: PaymentStatus.PAID },
        });
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
          ORDERS_NOTIFICATIONS.ORDER_PLACED,
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
      where.vendor = { authorId: user.id };
      if (query.vendorId) where.vendorId = query.vendorId;
    } else if (user.role === UserRole.DRIVER) {
      where.driverId = user.id;
    } else if (user.role === UserRole.MANAGER) {
      const zoneId = await this.managementService
        .getManagerZoneId(user.id)
        .catch(() => null);
      if (!zoneId) return null;
      where.vendor = { zoneId };
    }

    if (query.status) {
      where.status = query.status as OrderStatus;
    }
    return where;
  }

  async getCommissionReport(startDate?: Date, endDate?: Date) {
    return this.commissionService.getPlatformCommissionTotal(
      startDate,
      endDate,
    );
  }

  async getVendorCommissionReport(
    vendorId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.commissionService.getVendorNetReceivables(
      vendorId,
      startDate,
      endDate,
    );
  }

  async getDriverCommissionReport(
    driverId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.commissionService.getDriverEarnings(
      driverId,
      startDate,
      endDate,
    );
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
      // Extract zoneId from vendor for zone-based WebSocket broadcasts
      const zoneId = order.vendor?.zoneId;
      this.ordersGateway.emitOrderUpdate(mappedOrder, zoneId);
    }
    return mappedOrder;
  }

  private async processOrderCancellation(
    orderId: string,
    actor: User,
    reason: string,
    eventType:
      | AnalyticsEventType.ORDER_CANCELLED
      | AnalyticsEventType.DELIVERY_FAILED = AnalyticsEventType.ORDER_CANCELLED,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Re-fetch with vendor
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { vendor: true },
      });

      if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

      const previousStatus = order.status;

      // 1. Update Order Record (Reset Commissions and Vendor Net)
      const savedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          adminCommissionAmount: 0,
          adminCommissionPercentage: 0,
          driverCommissionValue: 0,
          driverCommissionRate: 0,
          vendorCommissionValue: 0,
          vendorNet: 0,
          vendorCommissionApplied: false,
          driverCommissionApplied: false,
          platformTotalCommission: 0,
        },
        include: orderInclude,
      });

      // 2. Handle Wallet Updates (ONLY if paymentMethod is wallet)
      if (order.paymentMethod === PaymentMethod.wallet) {
        // Refund Customer
        if (order.paymentStatus === PaymentStatus.PAID) {
          await this.walletService.refund(
            order.authorId,
            Number(order.orderTotal),
            WalletTransactionDescriptions.orderRefund(order.id, reason).en,
            WalletTransactionDescriptions.orderRefund(order.id, reason).ar,
            order.id,
            tx,
          );

          // Update payment status to unpaid since it's refunded
          await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: PaymentStatus.UNPAID },
          });
        }

        // --- REVERSALS ---
        // Reversals happen only if the order reached the credit stage (SHIPPED).

        const wasShipped =
          order.status === OrderStatus.SHIPPED ||
          order.status === OrderStatus.IN_TRANSIT ||
          order.status === OrderStatus.DRIVER_ACCEPTED;

        if (wasShipped) {
          // Reverse Vendor credit
          if (Number(order.vendorNet) > 0) {
            await this.walletService.updateVendorWallet(
              order.vendorId,
              Number(order.vendorNet),
              OrderConstants.WALLET_OPERATION_SUBTRACT,
              tx,
            );
          }

          // Reverse Driver credit (Pay + Tip)
          if (order.driverId && order.driverCommissionApplied) {
            const driverTotal =
              Number(order.driverNet) + Number(order.tipAmount);
            if (driverTotal > 0) {
              await this.walletService.updateDriverWallet(
                order.driverId,
                driverTotal,
                OrderConstants.WALLET_OPERATION_SUBTRACT,
                tx,
              );
            }
          }

          // Reverse Admin credit
          if (Number(order.platformTotalCommission) > 0) {
            await this.walletService.updateAdminWallet(
              Number(order.platformTotalCommission),
              OrderConstants.WALLET_OPERATION_SUBTRACT,
              tx,
            );
          }
        }
      }

      // 3. Track Status Update
      this.analyticsTrackingService.trackOrderLifecycle({
        orderId: savedOrder.id,
        eventType,
        previousStatus: previousStatus,
        newStatus: OrderStatus.CANCELLED,
        actorId: actor.id,
        actorRole: actor.role,
        metadata: { reason },
      });

      return savedOrder;
    });
  }

  /**
   * Customer confirms they received the order - releases wallet funds
   */
  async confirmDeliveryReceipt(
    orderId: string,
    user: User,
    confirmationType: DeliveryConfirmationType = DeliveryConfirmationType.CUSTOMER_CONFIRMATION,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { heldBalance: true },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);
    if (order.authorId !== user.id)
      throw new ForbiddenException(ORDERS_ERRORS.NOT_YOUR_ORDER);
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_DELIVERED_YET);
    }
    if (order.paymentMethod !== PaymentMethod.wallet) {
      throw new BadRequestException(ORDERS_ERRORS.NOT_A_WALLET_ORDER);
    }
    if (
      !order.heldBalance ||
      order.heldBalance.status !== HeldBalanceStatus.HELD
    ) {
      throw new BadRequestException(
        ORDERS_ERRORS.NO_HELD_BALANCE_OR_ALREADY_PROCESSED,
      );
    }

    // Release held funds to vendor, driver, admin
    await this.walletProtectionService.releaseHeldBalance(
      orderId,
      confirmationType,
      WalletTransactionDescriptions.deliveryConfirmedReason().ar,
    );

    return {
      success: true,
      message: 'DELIVERY_CONFIRMED',
      releasedAmount: Number(order.heldBalance.totalAmount),
    };
  }

  /**
   * Customer disputes that they didn't receive the order
   */
  async createOrderDispute(
    orderId: string,
    user: User,
    reason: string,
    evidence?: { photos?: string[]; notes?: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { heldBalance: true, disputes: true },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);
    if (order.authorId !== user.id)
      throw new ForbiddenException(ORDERS_ERRORS.NOT_YOUR_ORDER);
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_DELIVERED_YET);
    }
    if (order.paymentMethod !== PaymentMethod.wallet) {
      throw new BadRequestException(ORDERS_ERRORS.NOT_A_WALLET_ORDER);
    }
    if (
      !order.heldBalance ||
      order.heldBalance.status !== HeldBalanceStatus.HELD
    ) {
      throw new BadRequestException(
        ORDERS_ERRORS.NO_HELD_BALANCE_OR_ALREADY_PROCESSED,
      );
      ```typescript
    }
    if (order.disputes && order.disputes.length > 0) {
      throw new BadRequestException(ORDERS_ERRORS.DISPUTE_ALREADY_EXISTS);
    }

    // Create dispute - this will also mark HeldBalance
    const dispute = await this.walletProtectionService.createDispute(
      orderId,
      user.id,
      reason,
      evidence,
    );

    // Notify driver
    if (order.driverId) {
      const titleEn = await this.i18n.translate(
        'messages.DELIVERY_DISPUTED_TITLE',
        { lang: 'en' },
      );
      const titleAr = await this.i18n.translate(
        'messages.DELIVERY_DISPUTED_TITLE',
        { lang: 'ar' },
      );
      const bodyEn = await this.i18n.translate(
        'messages.DELIVERY_DISPUTED_BODY',
        { lang: 'en', args: { orderId } },
      );
      const bodyAr = await this.i18n.translate(
        'messages.DELIVERY_DISPUTED_BODY',
        { lang: 'ar', args: { orderId } },
      );

      await this.notificationService.sendCustomNotification(
        [order.driverId],
        { en: titleEn, ar: titleAr },
        {
          en: bodyEn,
          ar: bodyAr,
        },
        {
          orderId,
          disputeId: dispute.id,
          type: NotificationEventType.DISPUTE_CREATED,
        },
      );
    }

    return {
      success: true,
      message: 'DISPUTE_CREATED',
      disputeId: dispute.id,
    };
  }

  /**
   * Get order with held balance and dispute info
   */
  async getOrderProtectionStatus(orderId: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        heldBalance: true,
        disputes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);
    if (
      order.authorId !== user.id &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
    }

    return {
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      status: order.status,
      heldBalance: order.heldBalance
        ? {
          status: order.heldBalance.status,
          totalAmount: Number(order.heldBalance.totalAmount),
          autoReleaseDate: order.heldBalance.autoReleaseDate,
          releasedAt: order.heldBalance.releasedAt,
          releaseType: order.heldBalance.releaseType,
        }
        : null,
      dispute: order.disputes[0]
        ? {
          id: order.disputes[0].id,
          status: order.disputes[0].status,
          reason: order.disputes[0].reason,
          createdAt: order.disputes[0].createdAt,
          resolvedAt: order.disputes[0].resolvedAt,
        }
        : null,
      canConfirmDelivery: order.heldBalance?.status === HeldBalanceStatus.HELD,
      canDispute:
        order.heldBalance?.status === HeldBalanceStatus.HELD &&
        order.disputes.length === 0,
    };
  }

  async getDeliveryOtp(orderId: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        authorId: true,
        status: true,
        deliveryOtp: true,
        paymentMethod: true,
      },
    });

    if (!order) throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);

    // Only the customer who placed the order can see the OTP
    if (order.authorId !== user.id) {
      throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
    }

    // OTP only accessible when order is SHIPPED
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException(ORDERS_ERRORS.ORDER_NOT_SHIPPED);
    }

    // OTP only for wallet orders as requested
    if (order.paymentMethod !== PaymentMethod.wallet) {
      throw new BadRequestException(ORDERS_ERRORS.NOT_A_WALLET_ORDER);
    }

    return {
      orderId,
      otp: order.deliveryOtp,
    };
  }
}
