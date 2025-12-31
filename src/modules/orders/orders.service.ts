import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  Prisma,
  Product,
  User,
  UserRole
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CashbackService } from '../cashback/cashback.service';
import { CouponsService } from '../coupons/coupons.service';
import { ProductsService } from '../products/products.service';
import { ReviewsService } from '../reviews/reviews.service';
import { WalletService } from '../wallet/wallet.service';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersGateway } from './orders.gateway';

export interface OrderItemExtra {
  id: string;
  name: string;
  price: Prisma.Decimal;
  orderItemId: string;
}

export interface OrderAddress {
  id: string;
  orderId: string;
  city: string;
  street: string;
  building: string;
  floor: string | null;
  apartment: string | null;
  landmark: string | null;
  instructions: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Explicitly typing this to bypass potential type inference issues with generated client
const orderInclude = {
  author: true,
  vendor: true,
  driver: true,
  address: true,
  items: {
    include: {
      extras: true,
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

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
  ) { }

  async create(createOrderDto: CreateOrderDto, user: User) {
    const productIds = createOrderDto.products.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const subtotal = this.calculateSubtotal(createOrderDto.products, productMap);

    // Use transaction to ensure atomicity: if wallet payment succeeds but order creation fails,
    // the entire operation rolls back preventing money loss
    return await this.prisma.$transaction(async (tx) => {
      const totalAmount = await this.calculateTotalAmountInTransaction(
        createOrderDto,
        user,
        subtotal,
        tx,
      );

      const savedOrder = await tx.order.create({
        data: {
          vendorId: createOrderDto.vendorId,
          authorId: user.id,
          items: {
            create: createOrderDto.products.map((item) => {
              const product = productMap.get(item.productId);
              if (!product) {
                throw new NotFoundException(`Product ${item.productId} not found`);
              }
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
          totalAmount,
          status: OrderStatus.PLACED,
          address: {
            create: {
              ...createOrderDto.address,
            },
          },
          paymentMethod: createOrderDto.paymentMethod,
          driverId: null,
          notes: createOrderDto.notes,
          deliveryCharge: createOrderDto.deliveryCharge,
          tipAmount: createOrderDto.tipAmount,
          takeAway: createOrderDto.takeAway || false,
          scheduleTime: createOrderDto.scheduleTime
            ? new Date(createOrderDto.scheduleTime)
            : null,
        },
        include: orderInclude,
      });

      if (createOrderDto.paymentMethod === PaymentMethod.wallet) {
        await this.walletService.pay(
          user.id,
          totalAmount,
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

      const mappedOrder = this.mapOrderResponse(savedOrder);
      if (mappedOrder) {
        this.ordersGateway.emitOrderUpdate(mappedOrder);
      }
      return mappedOrder;
    });
  }

  /**
   * Map Prisma order relation to historical API structure
   */
  private mapOrderResponse(
    order: OrderWithRelations | null,
  ) {
    if (!order) return null;
    const { items, ...rest } = order;
    return {
      ...rest,
      products: items || [],
    };
  }

  /**
   * Calculate subtotal from product prices and extras
   */
  private calculateSubtotal(
    items: CreateOrderDto['products'],
    productMap: Map<string, Product>,
  ): number {
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      const price = product.discountPrice
        ? Number(product.discountPrice)
        : Number(product.price);
      let itemTotal = price * item.quantity;

      if (item.extras) {
        for (const extra of item.extras) {
          itemTotal += Number(extra.price);
        }
      }

      subtotal += itemTotal;
    }

    return subtotal;
  }

  /**
   * Calculate total amount including coupons, delivery, and tips
   * Also handles payment processing for wallet payments
   */
  private async calculateTotalAmount(
    createOrderDto: CreateOrderDto,
    user: User,
    subtotal: number,
  ): Promise<number> {
    let totalAmount = subtotal;
    let discountAmount = 0;

    // Apply Coupon
    if (createOrderDto.couponId) {
      const couponResult = await this.couponsService.validate(
        createOrderDto.couponId,
        createOrderDto.vendorId,
        subtotal,
      );
      discountAmount += couponResult.discountValue;
      totalAmount = subtotal - discountAmount;
    }

    // Apply Cashback (validation only, actual redemption happens after order creation)
    if (createOrderDto.cashbackId) {
      const cashback = await this.cashbackService.findOne(
        createOrderDto.cashbackId,
      );
      if (cashback && subtotal >= Number(cashback.minOrderAmount)) {
        // TODO: Apply cashback discount to total when feature is fully implemented
      }
    }

    // Add delivery charge and tip
    totalAmount += Number(createOrderDto.deliveryCharge || 0);
    totalAmount += Number(createOrderDto.tipAmount || 0);
    totalAmount = Math.max(totalAmount, 0);

    // Process payment for wallet
    // if (createOrderDto.paymentMethod === PaymentMethod.wallet) {
    //   await this.walletService.pay(
    //     user.id,
    //     totalAmount,
    //     `Payment for order at vendor ${createOrderDto.vendorId}`,
    //   );
    // }

    return totalAmount;
  }

  /**
   * Transaction-aware version of calculateTotalAmount
   * Uses the provided transaction client to ensure atomicity
   */
  private async calculateTotalAmountInTransaction(
    createOrderDto: CreateOrderDto,
    user: User,
    subtotal: number,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    let totalAmount = subtotal;
    let discountAmount = 0;

    if (createOrderDto.couponId) {
      const couponResult = await this.couponsService.validate(
        createOrderDto.couponId,
        createOrderDto.vendorId,
        subtotal,
      );
      discountAmount += couponResult.discountValue;
      totalAmount = subtotal - discountAmount;
    }

    if (createOrderDto.cashbackId) {
      const cashback = await this.cashbackService.findOne(
        createOrderDto.cashbackId,
      );
      if (cashback && subtotal >= Number(cashback.minOrderAmount)) {
        // TODO: Apply cashback discount to total when feature is fully implemented
      }
    }

    totalAmount += Number(createOrderDto.deliveryCharge || 0);
    totalAmount += Number(createOrderDto.tipAmount || 0);
    totalAmount = Math.max(totalAmount, 0);

    return totalAmount;
  }

  async findAll(
    user: Pick<User, 'id' | 'role'>,
    query: { vendorId?: string; status?: OrderStatus | string; firstOrder?: string }
  ) {
    const where: Prisma.OrderWhereInput = {};

    if (user.role === UserRole.CUSTOMER) {
      where.authorId = user.id;

      // Check if this is user's first order
      if (query.firstOrder === 'true') {
        const orderCount = await this.prisma.order.count({
          where: { authorId: user.id },
        });
        return { isFirstOrder: orderCount === 0 };
      }
    } else if (user.role === UserRole.VENDOR) {
      if (query.vendorId) where.vendorId = query.vendorId;
    } else if (user.role === UserRole.DRIVER) {
      where.driverId = user.id;
    }

    if (query.status) {
      where.status = query.status as OrderStatus;
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });

    return orders.map((order) =>
      this.mapOrderResponse(order),
    );
  }

  async findOne(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Authorization check
    if (user.role === UserRole.CUSTOMER && order.authorId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    // Helper logic for types if needed
    // const driverId = order.driverId;

    return this.mapOrderResponse(order);
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    user: User,
  ) {
    await this.findOne(id, user); // checks exist + auth

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: updateOrderStatusDto.status as OrderStatus },
      include: orderInclude,
    });

    const mappedOrder = this.mapOrderResponse(savedOrder);
    if (mappedOrder) {
      this.ordersGateway.emitOrderUpdate(mappedOrder);
    }
    return mappedOrder;
  }

  async assignDriver(id: string, assignDriverDto: AssignDriverDto, user: User) {
    await this.findOne(id, user);

    const savedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        driverId: assignDriverDto.driverId,
        status: OrderStatus.DRIVER_PENDING,
      },
      include: orderInclude,
    });

    const mappedOrder = this.mapOrderResponse(savedOrder);
    if (mappedOrder) {
      this.ordersGateway.emitOrderUpdate(mappedOrder);
    }
    return mappedOrder;
  }

  async getOrderReview(orderId: string, productId: string) {
    return this.reviewsService.findByOrderAndProduct(orderId, productId);
  }
}
// Refreshed types.
