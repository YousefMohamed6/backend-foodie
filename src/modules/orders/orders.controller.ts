import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { FindAllOrdersQueryDto } from './dto/find-all-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
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
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR, UserRole.DRIVER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'firstOrder', required: false, type: Boolean })
  async findAll(@Request() req, @Query() query: FindAllOrdersQueryDto) {
    const data = await this.ordersService.findAll(req.user, query);
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR, UserRole.DRIVER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get an order by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    const data = await this.ordersService.findOne(id, req.user);
    return { success: true, message: 'ORDER_SUCCESS', data };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.DRIVER)
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    const data = await this.ordersService.updateStatus(
      id,
      updateOrderStatusDto,
      req.user,
    );
    return { success: true, message: 'ORDER_SUCCESS', data };
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
  @ApiOperation({ summary: 'Get all cash orders still with a driver (Not yet handed over)' })
  async getDriverPendingCash(@Param('driverId') driverId: string, @Request() req) {
    const data = await this.ordersService.getDriverPendingCashOrders(
      driverId,
      req.user,
    );
    return { success: true, message: 'ORDER_SUCCESS', data };
  }
}
