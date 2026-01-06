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
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR, UserRole.DRIVER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'firstOrder', required: false, type: Boolean })
  findAll(@Request() req, @Query() query: FindAllOrdersQueryDto) {
    return this.ordersService.findAll(req.user, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR, UserRole.DRIVER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get an order by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.DRIVER)
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto, req.user);
  }

  @Get(':id/reviews/:productId')
  @ApiOperation({ summary: 'Get order review for a product' })
  getOrderReview(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.ordersService.getOrderReview(id, productId);
  }

  @Post(':id/assign-driver')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign a driver to an order' })
  assignDriver(
    @Param('id') id: string,
    @Body() assignDriverDto: AssignDriverDto,
    @Request() req,
  ) {
    return this.ordersService.assignDriver(id, assignDriverDto, req.user);
  }

  @Post(':id/reject')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Reject an assigned order' })
  rejectOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.rejectOrder(id, req.user);
  }

  @Post(':id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Accept an assigned order' })
  acceptOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.acceptOrder(id, req.user);
  }

  @Post(':id/report-cash')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Driver reports cash collection for COD order' })
  reportCashCollection(@Param('id') id: string, @Request() req) {
    return this.ordersService.reportCashCollection(id, req.user);
  }

  @Post(':id/confirm-cash')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Manager confirms cash receipt for COD order' })
  confirmCashReceipt(@Param('id') id: string, @Request() req) {
    return this.ordersService.confirmCashReceipt(id, req.user);
  }

  @Get('drivers/:driverId/pending-cash-orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get all cash orders still with a driver (Not yet handed over)' })
  getDriverPendingCash(@Param('driverId') driverId: string, @Request() req) {
    return this.ordersService.getDriverPendingCashOrders(driverId, req.user);
  }
}
