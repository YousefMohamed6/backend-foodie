import { Injectable } from '@nestjs/common';
import {
  DeliveryConfirmationType,
  OrderStatus,
  Prisma,
  User,
} from '@prisma/client';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { DriverReportProblemDto } from './dto/driver-report-problem.dto';
import { MarkOrderDeliveredDto } from './dto/mark-order-delivered.dto';
import { VendorAcceptOrderDto } from './dto/vendor-accept-order.dto';
import {
  OrderCashService,
  OrderCommissionReportsService,
  OrderCreationService,
  OrderDeliveryService,
  OrderDisputeService,
  OrderDriverService,
  OrderQueryService,
  OrderVendorService,
} from './services';

export interface OrderItemExtra {
  id: string;
  name: string;
  price: Prisma.Decimal;
  orderItemId: string;
}

/**
 * OrdersService Facade
 *
 * This service acts as a facade that delegates to specialized sub-services.
 * It maintains the same public API for backward compatibility with the controller.
 */
@Injectable()
export class OrdersService {
  constructor(
    private creationService: OrderCreationService,
    private queryService: OrderQueryService,
    private driverService: OrderDriverService,
    private vendorService: OrderVendorService,
    private deliveryService: OrderDeliveryService,
    private cashService: OrderCashService,
    private disputeService: OrderDisputeService,
    private commissionReportsService: OrderCommissionReportsService,
  ) { }

  // ==================== ORDER CREATION ====================

  async create(createOrderDto: CreateOrderDto, user: User) {
    return this.creationService.create(createOrderDto, user);
  }

  // ==================== ORDER QUERIES ====================

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
    return this.queryService.findAll(user, query);
  }

  async count(where: Prisma.OrderWhereInput) {
    return this.queryService.count(where);
  }

  async aggregate(args: Prisma.OrderAggregateArgs) {
    return this.queryService.aggregate(args);
  }

  async findOne(id: string, user: User) {
    return this.queryService.findOne(id, user);
  }

  async getOrderReview(orderId: string, productId: string) {
    return this.queryService.getOrderReview(orderId, productId);
  }

  // ==================== DRIVER OPERATIONS ====================

  async reportDeliveryProblem(
    id: string,
    dto: DriverReportProblemDto,
    user: User,
  ) {
    return this.driverService.reportDeliveryProblem(id, dto, user);
  }

  async assignDriver(id: string, assignDriverDto: AssignDriverDto, user: User) {
    return this.driverService.assignDriver(id, assignDriverDto, user);
  }

  async rejectOrder(id: string, user: User) {
    return this.driverService.rejectOrder(id, user);
  }

  async acceptOrder(id: string, user: User) {
    return this.driverService.acceptOrder(id, user);
  }

  async confirmPickup(id: string, user: User) {
    return this.driverService.confirmPickup(id, user);
  }

  // ==================== VENDOR OPERATIONS ====================

  async vendorRejectOrder(id: string, user: User) {
    return this.vendorService.vendorRejectOrder(id, user);
  }

  async vendorAcceptOrder(id: string, user: User, dto?: VendorAcceptOrderDto) {
    return this.vendorService.vendorAcceptOrder(id, user, dto);
  }

  // ==================== DELIVERY & CANCELLATION ====================

  async cancelOrder(id: string, user: User) {
    return this.deliveryService.cancelOrder(id, user);
  }

  async markOrderDelivered(
    id: string,
    user: User,
    dto?: MarkOrderDeliveredDto,
  ) {
    return this.deliveryService.markOrderDelivered(id, user, dto);
  }

  // ==================== CASH OPERATIONS ====================

  async reportCashCollection(id: string, user: User) {
    return this.cashService.reportCashCollection(id, user);
  }

  async confirmCashReceipt(id: string, user: User) {
    return this.cashService.confirmCashReceipt(id, user);
  }

  async getManagerPendingCashOrders(user: User) {
    return this.cashService.getManagerPendingCashOrders(user);
  }

  async getManagerCashSummary(user: User, date: string) {
    return this.cashService.getManagerCashSummary(user, date);
  }

  async getDriverPendingCashOrders(driverId: string, user: User) {
    return this.cashService.getDriverPendingCashOrders(driverId, user);
  }

  async confirmManagerPayout(managerId: string, date: string, adminUser: User) {
    return this.cashService.confirmManagerPayout(managerId, date, adminUser);
  }

  // ==================== COMMISSION REPORTS ====================

  async getCommissionReport(startDate?: Date, endDate?: Date) {
    return this.commissionReportsService.getCommissionReport(startDate, endDate);
  }

  async getVendorCommissionReport(
    vendorId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.commissionReportsService.getVendorCommissionReport(
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
    return this.commissionReportsService.getDriverCommissionReport(
      driverId,
      startDate,
      endDate,
    );
  }

  async getMonthlyCommissionReport(year: number, month: number) {
    return this.commissionReportsService.getMonthlyCommissionReport(year, month);
  }

  async getOrderCommissionSnapshots(orderId: string) {
    return this.commissionReportsService.getOrderCommissionSnapshots(orderId);
  }

  // ==================== WALLET PROTECTION & DISPUTES ====================

  async confirmDeliveryReceipt(
    orderId: string,
    user: User,
    confirmationType?: DeliveryConfirmationType,
  ) {
    return this.disputeService.confirmDeliveryReceipt(
      orderId,
      user,
      confirmationType,
    );
  }

  async createOrderDispute(
    orderId: string,
    user: User,
    reason: string,
    evidence?: { photos?: string[]; notes?: string },
  ) {
    return this.disputeService.createOrderDispute(orderId, user, reason, evidence);
  }

  async getOrderProtectionStatus(orderId: string, user: User) {
    return this.disputeService.getOrderProtectionStatus(orderId, user);
  }

  async getDeliveryOtp(orderId: string, user: User) {
    return this.disputeService.getDeliveryOtp(orderId, user);
  }
}
