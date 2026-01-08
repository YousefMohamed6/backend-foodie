# NestJS Backend Architecture - Native Implementation

## Overview
This document outlines a **completely native NestJS backend architecture** for the Restaurant/Foodie app. This is a **standalone implementation** with **zero Firebase dependencies**. All services (authentication, storage, notifications, real-time) are implemented using native Node.js/TypeScript solutions.

## Technology Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 14+ with PostGIS
- **ORM**: Prisma (Type-safety & Auto-migrations)
- **Authentication**: Native JWT (Passport.js) + bcrypt
- **OTP/SMS**: Twilio or similar
- **Email**: Nodemailer, SendGrid, or AWS SES
- **Social Auth**: Passport.js strategies + Token Verification (Google, Apple)
- **Validation**: class-validator, class-transformer
- **Queue**: Bull with Redis
- **Cache**: Redis
- **File Storage**: AWS S3 + Sharp (image processing)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Real-time**: Native Socket.io WebSocket Gateway with Redis adapter
- **API Documentation**: Swagger/OpenAPI

---

## Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
├── common/
│   ├── decorators/                 # Custom decorators
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── filters/                    # Exception filters
│   │   └── global-exception.filter.ts # 🆕 Enhanced with ERR_* codes
│   ├── guards/                     # Auth guards
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/               # Interceptors
│   │   └── transform.interceptor.ts
│   ├── pipes/                      # Validation pipes
│   │   └── validation.pipe.ts
│   ├── interfaces/                 # TypeScript interfaces
│   │   └── user.interface.ts
│   └── utils/                      # Utility functions
│       └── pagination.util.ts
├── config/
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── app.config.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── google.strategy.ts      # Native Google OAuth (no Firebase)
│   │   │   └── apple.strategy.ts      # Native Apple Sign-In (no Firebase)
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── verify-otp.dto.ts
│   │   │   ├── send-otp.dto.ts
│   │   │   └── forgot-password.dto.ts
│   │   └── interfaces/
│   │       └── jwt-payload.interface.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── users.repository.ts
│   ├── vendors/
│   │   ├── vendors.module.ts
│   │   ├── vendors.controller.ts
│   │   ├── vendors.service.ts
│   │   ├── entities/
│   │   │   └── vendor.entity.ts
│   │   ├── dto/
│   │   │   ├── create-vendor.dto.ts
│   │   │   └── update-vendor.dto.ts
│   │   └── vendors.repository.ts
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── entities/
│   │   │   └── product.entity.ts
│   │   └── dto/
│   │       ├── create-product.dto.ts
│   │       └── update-product.dto.ts
│   ├── orders/
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── order-pricing.service.ts  # 🆕 Pricing logic encapsulation
│   │   ├── order-management.service.ts # 🆕 Admin/Driver logic encapsulation
│   │   ├── entities/
│   │   │   ├── order.entity.ts
│   │   │   └── order-product.entity.ts
│   │   ├── dto/
│   │   │   ├── create-order.dto.ts
│   │   │   └── update-order-status.dto.ts
│   │   └── orders.gateway.ts      # WebSocket gateway
│   ├── wallet/
│   │   ├── wallet.module.ts
│   │   ├── wallet.controller.ts
│   │   ├── wallet.service.ts
│   │   ├── entities/
│   │   │   └── wallet-transaction.entity.ts
│   │   └── dto/
│   │       ├── topup.dto.ts
│   │       └── withdraw.dto.ts
│   ├── coupons/
│   │   ├── coupons.module.ts
│   │   ├── coupons.controller.ts
│   │   ├── coupons.service.ts
│   │   ├── entities/
│   │   │   └── coupon.entity.ts
│   │   └── dto/
│   │       └── validate-coupon.dto.ts
│   ├── cashback/
│   │   ├── cashback.module.ts
│   │   ├── cashback.controller.ts
│   │   ├── cashback.service.ts
│   │   └── entities/
│   │       ├── cashback.entity.ts
│   │       └── cashback-redeem.entity.ts
│   ├── subscriptions/
│   │   ├── subscriptions.module.ts
│   │   ├── subscriptions.controller.ts
│   │   ├── subscriptions.service.ts
│   │   ├── entities/
│   │   │   ├── subscription-plan.entity.ts
│   │   │   └── subscription-history.entity.ts
│   │   └── dto/
│   │       └── subscribe.dto.ts
│   ├── reviews/
│   │   ├── reviews.module.ts
│   │   ├── reviews.controller.ts
│   │   ├── reviews.service.ts
│   │   ├── entities/
│   │   │   └── rating.entity.ts
│   │   └── dto/
│   │       └── create-review.dto.ts
│   ├── favourites/
│   │   ├── favourites.module.ts
│   │   ├── favourites.controller.ts
│   │   ├── favourites.service.ts
│   │   └── entities/
│   │       ├── favourite.entity.ts
│   │       └── favourite-item.entity.ts
│   ├── referrals/
│   │   ├── referrals.module.ts
│   │   ├── referrals.controller.ts
│   │   ├── referrals.service.ts
│   │   └── entities/
│   │       └── referral.entity.ts
│   ├── gift-cards/
│   │   ├── gift-cards.module.ts
│   │   ├── gift-cards.controller.ts
│   │   ├── gift-cards.service.ts
│   │   └── entities/
│   │       ├── gift-card.entity.ts
│   │       └── gift-card-order.entity.ts
│   ├── chat/
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   ├── chat.gateway.ts        # WebSocket gateway
│   │   ├── entities/
│   │   │   ├── conversation.entity.ts
│   │   │   └── inbox.entity.ts
│   │   └── dto/
│   │       └── send-message.dto.ts
│   ├── stories/
│   │   ├── stories.module.ts
│   │   ├── stories.controller.ts
│   │   ├── stories.service.ts
│   │   └── entities/
│   │       └── story.entity.ts
│   ├── advertisements/
│   │   ├── advertisements.module.ts
│   │   ├── advertisements.controller.ts
│   │   ├── advertisements.service.ts
│   │   └── entities/
│   │       └── advertisement.entity.ts
│   ├── categories/
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   └── entities/
│   │       └── vendor-category.entity.ts
│   ├── zones/
│   │   ├── zones.module.ts
│   │   ├── zones.controller.ts
│   │   ├── zones.service.ts
│   │   └── entities/
│   │       ├── zone.entity.ts
│   │       └── tax.entity.ts
│   ├── drivers/
│   │   ├── drivers.module.ts
│   │   ├── drivers.controller.ts
│   │   ├── drivers.service.ts
│   │   └── entities/
│   │       └── driver-document.entity.ts
│   ├── settings/
│   │   ├── settings.module.ts
│   │   ├── settings.controller.ts
│   │   ├── settings.service.ts
│   │   └── entities/
│   │       ├── language.entity.ts
│   │       ├── currency.entity.ts
│   │       ├── banner.entity.ts
│   │       └── onboarding.entity.ts
│   └── upload/
│       ├── upload.module.ts
│       ├── upload.controller.ts
│       ├── upload.service.ts
│       └── config/
│           └── multer.config.ts
├── shared/
│   ├── services/
│   │   ├── payment.service.ts
│   │   ├── notification.service.ts    # Push notifications via FCM Admin SDK
│   │   ├── email.service.ts           # Native email service (Nodemailer/SendGrid)
│   │   ├── sms.service.ts            # Native SMS/OTP service (Twilio/AWS SNS)
│   │   ├── fcm.service.ts            # FCM Admin SDK (server-side only)
│   │   ├── geolocation.service.ts    # Native geolocation (no Firebase)
│   │   └── file-storage.service.ts   # Native file storage (S3/Local + Sharp + FFmpeg)
│   └── jobs/
│       ├── send-email.job.ts
│       ├── send-push-notification.job.ts
│       ├── process-order.job.ts
│       └── update-vendor-wallet.job.ts
└── database/
    ├── migrations/                 # TypeORM migrations
    └── seeds/                      # Database seeds

test/
├── unit/
├── integration/
└── e2e/
```

---

## Database Schema (TypeORM Entities)

### User Entity
```typescript
// src/modules/users/entities/user.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  countryCode: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profilePictureURL: string;

  @Column({ nullable: true })
  fcmToken: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  @Index()
  role: UserRole;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  walletAmount: number;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  isDocumentVerify: boolean;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  @Index()
  zoneId: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  @Index()
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  @Index()
  longitude: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  rotation: number;

  @Column({ nullable: true })
  carName: string;

  @Column({ nullable: true })
  carNumber: string;

  @Column({ nullable: true })
  carPictureURL: string;

  @Column('json', { nullable: true })
  inProgressOrderIds: string[];

  @Column('json', { nullable: true })
  orderRequestData: any;

  @Column({ nullable: true })
  subscriptionPlanId: string;

  @Column({ nullable: true })
  subscriptionExpiryDate: Date;

  @Column({ nullable: true })
  appIdentifier: string;

  @Column({ nullable: true })
  provider: string;

  @Column('json', { nullable: true })
  bankDetails: any;

  @Column('json', { nullable: true })
  shippingAddresses: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Vendor Entity
```typescript
// src/modules/vendors/entities/vendor.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Point } from 'typeorm';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  authorId: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  photo: string;

  @Column({ nullable: true })
  logo: string;

  @Column('json')
  categoryIds: string[];

  @Column('decimal', { precision: 10, scale: 8 })
  @Index()
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  @Index()
  longitude: number;

  @Column({
    type: 'point',
    spatialFeatureType: 'Point',
    nullable: true,
  })
  @Index({ spatial: true })
  coordinates: Point;

  @Column()
  @Index()
  zoneId: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  fcmToken: string;

  @Column({ default: true })
  restStatus: boolean;

  @Column({ default: false })
  dineInActive: boolean;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  walletAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  reviewsSum: number;

  @Column({ default: 0 })
  reviewsCount: number;

  @Column('json', { nullable: true })
  adminCommission: any;

  @Column({ nullable: true })
  subscriptionPlanId: string;

  @Column({ nullable: true })
  subscriptionExpiryDate: Date;

  @Column({ nullable: true })
  subscriptionTotalOrders: string;

  @Column({ default: false })
  isSelfDelivery: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Order Entity
```typescript
// src/modules/orders/entities/order.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { OrderProduct } from './order-product.entity';

export enum OrderStatus {
  PLACED = 'Order Placed',
  ACCEPTED = 'Order Accepted',
  REJECTED = 'Order Rejected',
  CANCELLED = 'Order Cancelled',
  DRIVER_PENDING = 'Driver Pending',
  COMPLETED = 'Order Completed',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  authorId: string;

  @Column()
  @Index()
  vendorId: string;

  @Column({ nullable: true })
  @Index()
  driverId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PLACED,
  })
  @Index()
  status: OrderStatus;

  @Column('json')
  address: any;

  @Column({ nullable: true })
  couponId: string;

  @Column({ nullable: true })
  couponCode: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column('json', { nullable: true })
  specialDiscount: any;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  deliveryCharge: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tipAmount: number;

  @Column()
  paymentMethod: string;

  @Column({ nullable: true })
  adminCommissionType: string;

  @Column({ nullable: true })
  adminCommission: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ default: false })
  takeAway: boolean;

  @Column({ nullable: true })
  estimatedTimeToPrepare: string;

  @Column({ nullable: true })
  scheduleTime: Date;

  @Column({ nullable: true })
  triggerDelivery: Date;

  @Column('json', { nullable: true })
  rejectedByDrivers: string[];

  @Column({ nullable: true })
  cashbackId: string;

  @Column('json', { nullable: true })
  taxSetting: any[];

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order, { cascade: true })
  products: OrderProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## Key Services Implementation

### Wallet Service
```typescript
// src/modules/wallet/wallet.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { User } from '../users/entities/user.entity';
import { TopupDto } from './dto/topup.dto';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    private dataSource: DataSource,
  ) {}

  async topUp(userId: string, topupDto: TopupDto): Promise<WalletTransaction> {
    return await this.dataSource.transaction(async (manager) => {
      // Create transaction record
      const transaction = manager.create(WalletTransaction, {
        userId,
        amount: topupDto.amount,
        paymentMethod: topupDto.paymentMethod,
        isTopup: true,
        paymentStatus: 'pending',
      });
      await manager.save(transaction);

      // Update user wallet
      await manager.increment(User, { id: userId }, 'walletAmount', topupDto.amount);

      // Send email notification
      await this.notificationService.sendEmail(userId, 'wallet_topup', {
        amount: topupDto.amount,
        transactionId: transaction.id,
      });

      return transaction;
    });
  }

  async updateVendorWallet(order: Order): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const subtotal = this.calculateOrderSubtotal(order);
      const specialDiscount = order.specialDiscount?.special_discount || 0;
      const taxAmount = this.calculateTax(order);

      let basePrice = subtotal - order.discount - specialDiscount;

      // Apply admin commission if enabled
      if (order.adminCommissionType === 'percentage') {
        basePrice = basePrice / (1 + parseFloat(order.adminCommission) / 100);
      }

      // Create vendor wallet transactions
      const orderTransaction = manager.create(WalletTransaction, {
        userId: order.vendor.authorId,
        amount: basePrice,
        paymentMethod: 'wallet',
        isTopup: true,
        orderId: order.id,
        transactionUser: 'vendor',
        note: 'Order Amount credited',
        paymentStatus: 'success',
      });
      await manager.save(orderTransaction);

      const taxTransaction = manager.create(WalletTransaction, {
        userId: order.vendor.authorId,
        amount: taxAmount,
        paymentMethod: 'tax',
        isTopup: true,
        orderId: order.id,
        transactionUser: 'vendor',
        note: 'Order Tax credited',
        paymentStatus: 'success',
      });
      await manager.save(taxTransaction);

      // Update vendor wallet
      await manager.increment(
        Vendor,
        { id: order.vendorId },
        'walletAmount',
        basePrice + taxAmount,
      );
    });
  }

  private calculateOrderSubtotal(order: Order): number {
    return order.products.reduce((sum, product) => {
      const price = product.discountPrice > 0 ? product.discountPrice : product.price;
      return sum + price * product.quantity + product.extrasPrice * product.quantity;
    }, 0);
  }

  private calculateTax(order: Order): number {
    // Tax calculation logic
    return 0;
  }
}
```

### Order Service
```typescript
// src/modules/orders/orders.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CouponsService } from '../coupons/coupons.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../../shared/services/notification.service';
import { OrdersGateway } from './orders.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private couponsService: CouponsService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private ordersGateway: OrdersGateway,
    private dataSource: DataSource,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    return await this.dataSource.transaction(async (manager) => {
      // Validate coupon if provided
      let discount = 0;
      if (createOrderDto.couponId) {
        const couponValidation = await this.couponsService.validate(
          createOrderDto.couponId,
          createOrderDto.vendorId,
          createOrderDto.total,
        );
        discount = couponValidation.discount;
      }

      // Calculate totals
      const subtotal = this.calculateSubtotal(createOrderDto.products);
      const taxAmount = this.calculateTax(createOrderDto);
      const deliveryCharge = createOrderDto.deliveryCharge || 0;
      const tipAmount = createOrderDto.tipAmount || 0;
      const total = subtotal + taxAmount + deliveryCharge + tipAmount - discount;

      // Create order
      const order = manager.create(Order, {
        authorId: userId,
        vendorId: createOrderDto.vendorId,
        status: OrderStatus.PLACED,
        address: createOrderDto.address,
        paymentMethod: createOrderDto.paymentMethod,
        discount,
        deliveryCharge,
        tipAmount,
        taxSetting: createOrderDto.taxSetting || [],
        takeAway: createOrderDto.takeAway || false,
        notes: createOrderDto.notes || null,
        scheduleTime: createOrderDto.scheduleTime || null,
      });

      const savedOrder = await manager.save(order);

      // Attach products
      const orderProducts = createOrderDto.products.map((product) =>
        manager.create(OrderProduct, {
          orderId: savedOrder.id,
          ...product,
        }),
      );
      await manager.save(orderProducts);

      // Process payment
      if (createOrderDto.paymentMethod === 'wallet') {
        await this.walletService.deduct(userId, total);
      }

      // Broadcast order event
      this.ordersGateway.handleOrderPlaced(savedOrder);

      // Send push notification
      await this.notificationService.sendPush(
        order.vendor.fcmToken,
        'New Order',
        { orderId: savedOrder.id },
      );

      return savedOrder;
    });
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['vendor', 'products'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = status;
    const updatedOrder = await this.orderRepository.save(order);

    // Broadcast status change
    this.ordersGateway.handleOrderStatusChanged(updatedOrder);

    // If order completed, update vendor wallet
    if (status === OrderStatus.COMPLETED) {
      await this.walletService.updateVendorWallet(updatedOrder);
    }

    return updatedOrder;
  }

  private calculateSubtotal(products: any[]): number {
    return products.reduce((sum, product) => {
      const price = product.discountPrice > 0 ? product.discountPrice : product.price;
      return sum + price * product.quantity + (product.extrasPrice || 0) * product.quantity;
    }, 0);
  }

  private calculateTax(orderDto: CreateOrderDto): number {
    // Tax calculation logic
    return 0;
  }
}
```

### Geolocation Service
```typescript
// src/shared/services/geolocation.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../../modules/vendors/entities/vendor.entity';

@Injectable()
export class GeolocationService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
  ) {}

  async getNearestVendors(
    latitude: number,
    longitude: number,
    radius: number = 10,
    isDining?: boolean,
  ): Promise<Vendor[]> {
    const query = this.vendorRepository
      .createQueryBuilder('vendor')
      .select([
        'vendor.*',
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(vendor.latitude)) *
            cos(radians(vendor.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(vendor.latitude))
          )
        ) AS distance`,
      ])
      .where('vendor.restStatus = :restStatus', { restStatus: true })
      .having('distance <= :radius', { radius })
      .orderBy('distance', 'ASC')
      .setParameters({ lat: latitude, lng: longitude });

    if (isDining !== undefined) {
      query.andWhere('vendor.dineInActive = :isDining', { isDining });
    }

    return query.getRawMany();
  }

  async getTaxList(latitude: number, longitude: number): Promise<Tax[]> {
    // Find zone based on coordinates using PostGIS
    const zone = await this.zoneRepository
      .createQueryBuilder('zone')
      .where(
        `ST_Contains(zone.boundary, ST_GeomFromText('POINT(:lng :lat)', 4326))`,
        { lng: longitude, lat: latitude },
      )
      .getOne();

    return zone ? zone.taxes : [];
  }
}
```

---

## Native Service Implementations

### Authentication Service (Native JWT + bcrypt)

```typescript
// src/modules/auth/auth.service.ts

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SmsService } from '../../shared/services/sms.service';
import { EmailService } from '../../shared/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private smsService: SmsService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const token = this.generateToken(savedUser);

    return {
      user: this.sanitizeUser(savedUser),
      token,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async sendOtp(phoneNumber: string, countryCode: string) {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis with expiration (5 minutes)
    await this.redisService.set(
      `otp:${countryCode}${phoneNumber}`,
      otp,
      'EX',
      300,
    );

    // Send OTP via SMS service
    await this.smsService.sendSms(
      `${countryCode}${phoneNumber}`,
      `Your verification code is: ${otp}`,
    );

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phoneNumber: string, countryCode: string, otp: string) {
    // Verify OTP from Redis
    const storedOtp = await this.redisService.get(`otp:${countryCode}${phoneNumber}`);

    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Delete OTP after verification
    await this.redisService.del(`otp:${countryCode}${phoneNumber}`);

    // Find or create user
    let user = await this.userRepository.findOne({
      where: { phoneNumber, countryCode },
    });

    if (!user) {
      user = this.userRepository.create({
        phoneNumber,
        countryCode,
        role: UserRole.CUSTOMER,
      });
      user = await this.userRepository.save(user);
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists for security
      return { message: 'If user exists, password reset email sent' };
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      { userId: user.id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    // Store reset token in Redis
    await this.redisService.set(`reset:${user.id}`, resetToken, 'EX', 3600);

    // Send reset email
    await this.emailService.sendPasswordReset(user.email, resetToken);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Invalid token');
      }

      // Verify token exists in Redis
      const storedToken = await this.redisService.get(`reset:${payload.userId}`);
      if (storedToken !== token) {
        throw new BadRequestException('Invalid or expired token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await this.userRepository.update(payload.userId, {
        password: hashedPassword,
      });

      // Delete reset token
      await this.redisService.del(`reset:${payload.userId}`);

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
```

### SMS/OTP Service (Native)

```typescript
// src/shared/services/sms.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private twilioClient: twilio.Twilio;

  constructor(private configService: ConfigService) {
    // Initialize Twilio client (or AWS SNS)
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      // Fallback: Log to console in development
      console.log(`SMS to ${to}: ${message}`);
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: this.configService.get('TWILIO_PHONE_NUMBER'),
        to,
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw new Error('Failed to send SMS');
    }
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    const message = `Your verification code is: ${otp}. Valid for 5 minutes.`;
    await this.sendSms(phoneNumber, message);
  }
}
```

### Email Service (Native)

```typescript
// src/shared/services/email.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private emailTemplateService: EmailTemplateService,
  ) {
    // Initialize Nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${resetToken}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `;

    await this.sendEmail(email, 'Password Reset Request', html);
  }

  async sendWalletTopupEmail(
    email: string,
    amount: number,
    transactionId: string,
  ): Promise<void> {
    const template = await this.emailTemplateService.getTemplate('wallet_topup');
    const html = template.replace('{amount}', amount.toString())
                         .replace('{transactionId}', transactionId);

    await this.sendEmail(email, 'Wallet Top-up Confirmation', html);
  }
}
```

### File Storage Service (Native - S3 + Image/Video Processing)

```typescript
// src/shared/services/file-storage.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class FileStorageService {
  private s3: AWS.S3;
  private bucketName: string;
  private useLocalStorage: boolean;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get('AWS_S3_BUCKET');
    this.useLocalStorage = this.configService.get('USE_LOCAL_STORAGE') === 'true';

    if (!this.useLocalStorage) {
      this.s3 = new AWS.S3({
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        region: this.configService.get('AWS_REGION'),
      });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    if (this.useLocalStorage) {
      return this.uploadToLocal(file, fileName);
    } else {
      return this.uploadToS3(file, fileName);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'images',
    options?: { width?: number; height?: number; quality?: number },
  ): Promise<string> {
    // Process image with Sharp
    let imageBuffer = file.buffer;

    if (options) {
      const sharpInstance = sharp(file.buffer);

      if (options.width || options.height) {
        sharpInstance.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      imageBuffer = await sharpInstance
        .jpeg({ quality: options.quality || 85 })
        .toBuffer();
    }

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    if (this.useLocalStorage) {
      return this.uploadToLocal({ ...file, buffer: imageBuffer }, fileName);
    } else {
      return this.uploadToS3({ ...file, buffer: imageBuffer }, fileName);
    }
  }

  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'videos',
  ): Promise<{ videoUrl: string; thumbnailUrl: string }> {
    const videoFileName = `${folder}/${Date.now()}-${file.originalname}`;
    const thumbnailFileName = `${folder}/thumbnails/${Date.now()}-thumb.jpg`;

    // Upload video
    const videoUrl = this.useLocalStorage
      ? await this.uploadToLocal(file, videoFileName)
      : await this.uploadToS3(file, videoFileName);

    // Generate thumbnail using FFmpeg
    const thumbnailBuffer = await this.generateVideoThumbnail(file.buffer);
    const thumbnailFile = {
      ...file,
      buffer: thumbnailBuffer,
      originalname: 'thumbnail.jpg',
    };

    const thumbnailUrl = this.useLocalStorage
      ? await this.uploadToLocal(thumbnailFile, thumbnailFileName)
      : await this.uploadToS3(thumbnailFile, thumbnailFileName);

    return { videoUrl, thumbnailUrl };
  }

  private async uploadToS3(file: Express.Multer.File, fileName: string): Promise<string> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    await this.s3.putObject(params).promise();

    return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
  }

  private async uploadToLocal(file: Express.Multer.File, fileName: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, fileName);

    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, file.buffer);

    return `${this.configService.get('APP_URL')}/uploads/${fileName}`;
  }

  private async generateVideoThumbnail(videoBuffer: Buffer): Promise<Buffer> {
    // Save video buffer to temp file
    const tempVideoPath = path.join(process.cwd(), `temp-${Date.now()}.mp4`);
    const tempThumbPath = path.join(process.cwd(), `temp-thumb-${Date.now()}.jpg`);

    try {
      fs.writeFileSync(tempVideoPath, videoBuffer);

      // Generate thumbnail using FFmpeg
      await execAsync(
        `ffmpeg -i ${tempVideoPath} -ss 00:00:01 -vframes 1 ${tempThumbPath}`,
      );

      // Read thumbnail buffer
      const thumbnailBuffer = fs.readFileSync(tempThumbPath);

      // Cleanup temp files
      fs.unlinkSync(tempVideoPath);
      fs.unlinkSync(tempThumbPath);

      return thumbnailBuffer;
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      if (fs.existsSync(tempThumbPath)) fs.unlinkSync(tempThumbPath);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (this.useLocalStorage) {
      const fileName = fileUrl.split('/uploads/')[1];
      const filePath = path.join(process.cwd(), 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      const fileName = fileUrl.split('.com/')[1];
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: fileName,
      }).promise();
    }
  }
}
```

### FCM Service (Server-side Only - No Client Firebase)

```typescript
// src/shared/services/fcm.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  private firebaseAdmin: admin.app.App;

  constructor(private configService: ConfigService) {
    // Initialize Firebase Admin SDK (server-side only)
    // This is NOT Firebase client SDK - it's for sending push notifications
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(
        this.configService.get('FIREBASE_SERVICE_ACCOUNT'),
      );

      this.firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      this.firebaseAdmin = admin.app();
    }
  }

  async sendNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
        },
      };

      await admin.messaging().send(message);
    } catch (error) {
      console.error('Failed to send FCM notification:', error);
      // Handle invalid tokens, etc.
      if (error.code === 'messaging/invalid-registration-token') {
        // Remove invalid token from database
        // await this.userRepository.update({ fcmToken }, { fcmToken: null });
      }
    }
  }

  async sendMulticast(
    fcmTokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<admin.messaging.BatchResponse> {
    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    };

    return await admin.messaging().sendEachForMulticast(message);
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    await admin.messaging().subscribeToTopic(tokens, topic);
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    await admin.messaging().send(message);
  }
}
```

---

## WebSocket Gateway (Native Real-time - No Firebase)

**Note**: All real-time features use native Socket.io WebSocket implementation. No Firebase Realtime Database is used.

### Socket.io Configuration with Redis Adapter

```typescript
// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure Socket.io with Redis adapter for scaling
  const redisAdapter = await createRedisAdapter();
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(3000,'0.0.0.0');
}

async function createRedisAdapter() {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  return createAdapter(pubClient, subClient);
}

bootstrap();
```

### Orders Gateway
```typescript
// src/modules/orders/orders.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Order } from './entities/order.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/orders',
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  handleOrderPlaced(order: Order) {
    // Notify vendor
    this.server.to(`vendor:${order.vendorId}`).emit('order:placed', order);
  }

  handleOrderStatusChanged(order: Order) {
    // Notify customer, vendor, and driver
    this.server.to(`order:${order.id}`).emit('order:status', {
      orderId: order.id,
      status: order.status,
    });
    this.server.to(`vendor:${order.vendorId}`).emit('order:status', {
      orderId: order.id,
      status: order.status,
    });
    if (order.driverId) {
      this.server.to(`driver:${order.driverId}`).emit('order:status', {
        orderId: order.id,
        status: order.status,
      });
    }
  }

  @SubscribeMessage('join:order')
  handleJoinOrder(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
  }

  @SubscribeMessage('join:vendor')
  handleJoinVendor(client: Socket, vendorId: string) {
    client.join(`vendor:${vendorId}`);
  }
}
```

### Chat Gateway
```typescript
// src/modules/chat/chat.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('send:message')
  async handleMessage(@MessageBody() sendMessageDto: SendMessageDto) {
    const message = await this.chatService.sendMessage(sendMessageDto);
    
    // Broadcast to thread participants
    this.server.to(`thread:${sendMessageDto.threadId}`).emit('chat:message', message);
    
    return message;
  }

  @SubscribeMessage('join:thread')
  handleJoinThread(client: Socket, threadId: string) {
    client.join(`thread:${threadId}`);
  }
}
```

---

## Controllers

### Upload Controller (Native File Storage)

```typescript
// src/modules/upload/upload.controller.ts

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FileStorageService } from '../../shared/services/file-storage.service';

@ApiTags('Upload')
@Controller('api/v1/upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private fileStorageService: FileStorageService) {}

  @Post('user-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadUserImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.fileStorageService.uploadImage(file, 'users', {
      width: 500,
      height: 500,
      quality: 85,
    });

    return { url };
  }

  @Post('product-image')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.fileStorageService.uploadImage(file, 'products', {
      width: 800,
      height: 800,
      quality: 90,
    });

    return { url };
  }

  @Post('story')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadStory(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (file.mimetype.startsWith('image/')) {
      const url = await this.fileStorageService.uploadImage(file, 'stories');
      return { url, type: 'image' };
    } else if (file.mimetype.startsWith('video/')) {
      const { videoUrl, thumbnailUrl } = await this.fileStorageService.uploadVideo(
        file,
        'stories',
      );
      return { videoUrl, thumbnailUrl, type: 'video' };
    }

    throw new BadRequestException('Invalid file type');
  }

  @Post('chat-media')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChatMedia(@UploadedFile() file: Express.Multer.File) {
    if (file.mimetype.startsWith('image/')) {
      const url = await this.fileStorageService.uploadImage(file, 'chat');
      return { url, thumbnailUrl: url, type: 'image' };
    } else if (file.mimetype.startsWith('video/')) {
      const { videoUrl, thumbnailUrl } = await this.fileStorageService.uploadVideo(
        file,
        'chat',
      );
      return { url: videoUrl, thumbnailUrl, type: 'video' };
    }

    throw new BadRequestException('Invalid file type');
  }
}
```

### Orders Controller
```typescript
// src/modules/orders/orders.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Orders')
@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  async findAll(@Request() req, @Query() query: any) {
    return this.ordersService.findByUser(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @Roles('vendor', 'admin', 'driver')
  @UseGuards(RolesGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto.status);
  }
}
```

---

## DTOs with Validation

### Create Order DTO
```typescript
// src/modules/orders/dto/create-order.dto.ts

import { IsString, IsArray, IsNumber, IsBoolean, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ProductDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  extrasPrice?: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  vendorId: string;

  @ApiProperty({ type: [ProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products: ProductDto[];

  @ApiProperty()
  @IsString()
  paymentMethod: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  deliveryCharge?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  takeAway?: boolean;
}
```

---

## Guards & Decorators

### Roles Guard
```typescript
// src/common/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### Roles Decorator
```typescript
// src/common/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

---

## Queue Jobs (BullMQ)

### Send Email Job
```typescript
// src/shared/jobs/send-email.job.ts

import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailService } from '../services/email.service';

@Processor('email')
export class SendEmailJob {
  constructor(private emailService: EmailService) {}

  @Process('send')
  async handleSendEmail(job: Job<{ userId: string; template: string; data: any }>) {
    const { userId, template, data } = job.data;
    await this.emailService.send(userId, template, data);
  }
}
```

---

## Module Configuration

### App Module
```typescript
// src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
// ... other modules

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Use migrations in production
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    OrdersModule,
    // ... other modules
  ],
})
export class AppModule {}
```

---

## Testing

### Unit Test Example
```typescript
// src/modules/orders/orders.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

---

## Deployment Considerations

1. **Environment Variables**: Use `@nestjs/config` for configuration
2. **Database Migrations**: Run migrations on deployment
3. **Queue Workers**: Run separate processes for BullMQ workers
4. **WebSocket**: Use Socket.io with Redis adapter for scaling
5. **File Storage**: Configure S3 or local storage
6. **Monitoring**: Integrate Sentry, Prometheus, or similar
7. **API Documentation**: Swagger/OpenAPI at `/api/docs`

---

## Native Implementation Guide

This is a **completely native implementation** with zero Firebase dependencies. Follow these steps to set up:

### Phase 1: Project Setup
1. Initialize NestJS project: `nest new restaurant-api`
2. Install dependencies:
   ```bash
   npm install @nestjs/typeorm typeorm pg
   npm install @nestjs/jwt @nestjs/passport passport passport-jwt
   npm install bcrypt class-validator class-transformer
   npm install @nestjs/bull bull redis
   npm install @nestjs/platform-socket.io socket.io
   npm install @socket.io/redis-adapter redis
   npm install multer @types/multer
   npm install aws-sdk sharp
   npm install nodemailer @types/nodemailer
   npm install twilio
   npm install firebase-admin
   npm install @nestjs/swagger swagger-ui-express
   ```
3. Set up PostgreSQL database
4. Configure environment variables (`.env`)

### Phase 2: Core Modules
1. **Authentication Module**:
   - Implement JWT strategy with Passport
   - Add bcrypt for password hashing
   - Set up OTP/SMS service (Twilio)
   - Configure email service (Nodemailer)
   - Implement social login strategies (Google/Apple) without Firebase

2. **Database Setup**:
   - Create TypeORM entities for all models
   - Set up database migrations
   - Create seeders for initial data

### Phase 3: Business Logic Modules
1. Implement Users, Vendors, Products modules
2. Implement Orders module with business logic
3. Implement Wallet module with transaction handling
4. Implement Coupons, Cashback, Subscriptions modules

### Phase 4: File Storage & Media
1. Configure Multer for file uploads
2. Set up S3 integration (or local storage)
3. Implement image processing with Sharp
4. Implement video processing with FFmpeg

### Phase 5: Real-time Features
1. Set up Socket.io WebSocket gateway
2. Configure Redis adapter for scaling
3. Implement order status updates
4. Implement driver location tracking
5. Implement chat/messaging

### Phase 6: Push Notifications
1. Set up Firebase Admin SDK (server-side only)
2. Implement FCM service for sending notifications
3. Set up device token management in database
4. Implement notification queuing

### Phase 7: Integration & Testing
1. Update Flutter app to use new REST API endpoints
2. Replace Firebase Auth calls with JWT authentication
3. Replace Firebase Storage with native file upload endpoints
4. Replace Firebase Realtime Database with WebSocket connections
5. Test all endpoints and real-time features

### Environment Variables Required

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=restaurant_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# AWS S3 (or use local storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
USE_LOCAL_STORAGE=false

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@restaurant.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Admin SDK (for push notifications only)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# App
APP_URL=http://localhost:3000
NODE_ENV=development
```

### Key Differences from Firebase Implementation

1. **Authentication**: Native JWT + bcrypt instead of Firebase Auth
2. **Database**: PostgreSQL with TypeORM instead of Firestore
3. **Storage**: S3/Local storage instead of Firebase Storage
4. **Real-time**: Socket.io WebSocket instead of Firebase Realtime Database
5. **Notifications**: FCM Admin SDK (server-side) instead of client-side Firebase
6. **OTP/SMS**: Twilio/AWS SNS instead of Firebase Phone Auth
7. **Email**: Nodemailer/SendGrid instead of Firebase Functions

### Benefits of Native Implementation

- ✅ **Full Control**: Complete control over data and business logic
- ✅ **No Vendor Lock-in**: Not dependent on Firebase services
- ✅ **Better Performance**: Optimized queries with SQL database
- ✅ **Cost Effective**: Pay only for what you use (S3, SMS, etc.)
- ✅ **Scalability**: Horizontal scaling with Redis and load balancers
- ✅ **Type Safety**: Full TypeScript support throughout
- ✅ **Flexibility**: Easy to customize and extend

