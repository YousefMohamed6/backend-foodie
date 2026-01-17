import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { DriverReportProblemDto } from './dto/driver-report-problem.dto';
import { FindAllOrdersQueryDto } from './dto/find-all-orders-query.dto';
import { MarkOrderDeliveredDto } from './dto/mark-order-delivered.dto';
import { VendorAcceptOrderDto } from './dto/vendor-accept-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    const data = await this.ordersService.create(createOrderDto, req.user);
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.CUSTOMER,
    UserRole.VENDOR,
    UserRole.DRIVER,
    UserRole.MANAGER,
  )
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'firstOrder', required: false, type: Boolean })
  async findAll(@Request() req, @Query() query: FindAllOrdersQueryDto) {
    const data = await this.ordersService.findAll(req.user, query);
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.CUSTOMER,
    UserRole.VENDOR,
    UserRole.DRIVER,
    UserRole.MANAGER,
  )
  @ApiOperation({ summary: 'Get an order by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.findOne(id, req.user);
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cancel an order' })
  async cancelOrder(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.cancelOrder(id, req.user);
    return { success: true, message: 'ORDER_CANCELLED', data };
  }

  @Get(':id/reviews/:productId')
  @ApiOperation({ summary: 'Get order review for a product' })
  async getOrderReview(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    const data = await this.ordersService.getOrderReview(id, productId);
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Post(':id/assign-driver')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign a driver to an order' })
  async assignDriver(
    @Param('id') id: string,
    @Body() assignDriverDto: AssignDriverDto,
    @Request() req,
  ) {
    const data = await this.ordersService.assignDriver(
      id,
      assignDriverDto,
      req.user,
    );
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Post(':id/reject')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Reject an assigned order' })
  async rejectOrder(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.rejectOrder(id, req.user);
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Post(':id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Accept an assigned order' })
  async acceptOrder(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.acceptOrder(id, req.user);
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Post(':id/report-problem')
  @Roles(UserRole.DRIVER)
  @ApiOperation({
    summary: 'Driver reports a problem with the order (Emergency cancel)',
  })
  async reportProblem(
    @Param('id') id: string,
    @Body() dto: DriverReportProblemDto,
    @Request() req,
  ) {
    const data = await this.ordersService.reportDeliveryProblem(
      id,
      dto,
      req.user,
    );
    return { success: true, message: 'PROBLEM_REPORTED', data };
  }

  @Post(':id/pickup')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Driver confirms order pickup from vendor' })
  async confirmPickup(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.confirmPickup(id, req.user);
    return { success: true, message: 'ORDER_PICKED_UP', data };
  }

  @Post(':id/report-cash')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Driver reports cash collection for COD order' })
  async reportCashCollection(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.reportCashCollection(id, req.user);
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Post(':id/confirm-cash')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Manager confirms cash receipt for COD order' })
  async confirmCashReceipt(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.confirmCashReceipt(id, req.user);
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Get('drivers/:driverId/pending-cash-orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER)
  @ApiOperation({
    summary: 'Get all cash orders still with a driver (Not yet handed over)',
  })
  async getDriverPendingCash(
    @Param('driverId') driverId: string,
    @Request() req,
  ) {
    const data = await this.ordersService.getDriverPendingCashOrders(
      driverId,
      req.user,
    );
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Post(':id/vendor-accept')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({
    summary:
      'Vendor accepts order (triggers vendor commission if on free plan)',
  })
  async vendorAcceptOrder(
    @Param('id') id: string,
    @Body() vendorAcceptOrderDto: VendorAcceptOrderDto,
    @Request() req,
  ) {
    const data = await this.ordersService.vendorAcceptOrder(
      id,
      req.user,
      vendorAcceptOrderDto,
    );
    return { success: true, message: 'ORDER_ACCEPTED', data };
  }

  @Post(':id/vendor-reject')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Vendor rejects order' })
  async vendorRejectOrder(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.vendorRejectOrder(id, req.user);
    return { success: true, message: 'ORDER_REJECTED', data };
  }

  @Post(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  @ApiOperation({
    summary: 'Mark order as completed (triggers driver commission)',
  })
  async markOrderCompleted(
    @Param('id') id: string,
    @Body() dto: MarkOrderDeliveredDto,
    @Request() req,
  ) {
    const data = await this.ordersService.markOrderDelivered(id, req.user, dto);
    return { success: true, message: 'ORDER_COMPLETED', data };
  }

  @Get(':id/commission-snapshots')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get commission snapshots for an order' })
  async getOrderCommissionSnapshots(@Param('id') id: string) {
    const data = await this.ordersService.getOrderCommissionSnapshots(id);
    return { success: true, message: 'COMMISSION_SNAPSHOTS_RETRIEVED', data };
  }

  @Get('reports/commission')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get platform commission report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getCommissionReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const data = await this.ordersService.getCommissionReport(start, end);
    return { success: true, message: 'COMMISSION_REPORT_RETRIEVED', data };
  }

  @Get('reports/commission/monthly/:year/:month')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get monthly commission report' })
  async getMonthlyCommissionReport(
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    const data = await this.ordersService.getMonthlyCommissionReport(
      parseInt(year),
      parseInt(month),
    );
    return {
      success: true,
      message: 'MONTHLY_COMMISSION_REPORT_RETRIEVED',
      data,
    };
  }

  @Get('reports/vendor/:vendorId/commission')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Get vendor commission report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getVendorCommissionReport(
    @Param('vendorId') vendorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const data = await this.ordersService.getVendorCommissionReport(
      vendorId,
      start,
      end,
    );
    return {
      success: true,
      message: 'VENDOR_COMMISSION_REPORT_RETRIEVED',
      data,
    };
  }

  @Get('reports/driver/:driverId/commission')
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get driver commission report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getDriverCommissionReport(
    @Param('driverId') driverId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const data = await this.ordersService.getDriverCommissionReport(
      driverId,
      start,
      end,
    );
    return {
      success: true,
      message: 'DRIVER_COMMISSION_REPORT_RETRIEVED',
      data,
    };
  }

  // === WALLET PROTECTION ENDPOINTS ===

  @Post(':id/confirm-delivery')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Customer confirms delivery receipt - releases wallet funds',
  })
  async confirmDelivery(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.confirmDeliveryReceipt(id, req.user);
    return { success: true, message: 'DELIVERY_CONFIRMED', data };
  }

  @Post(':id/dispute')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer disputes non-receipt of order' })
  async createDispute(
    @Param('id') id: string,
    @Body()
    dto: { reason: string; evidence?: { photos?: string[]; notes?: string } },
    @Request() req,
  ) {
    const data = await this.ordersService.createOrderDispute(
      id,
      req.user,
      dto.reason,
      dto.evidence,
    );
    return { success: true, message: 'DISPUTE_CREATED', data };
  }

  @Get(':id/protection-status')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get wallet protection status for order' })
  async getProtectionStatus(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.getOrderProtectionStatus(
      id,
      req.user,
    );
    return { success: true, message: 'PROTECTION_STATUS_RETRIEVED', data };
  }

  @Get(':id/delivery-otp')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get delivery OTP for a shipped order' })
  async getDeliveryOtp(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.getDeliveryOtp(id, req.user);
    return { success: true, message: 'OTP_RETRIEVED', data };
  }
}
