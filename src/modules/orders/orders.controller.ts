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
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new order' })
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'firstOrder', required: false, type: Boolean })
  findAll(@Request() req, @Query() query) {
    return this.ordersService.findAll(req.user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user);
  }

  @Patch(':id/status')
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
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Assign a driver to an order' })
  assignDriver(
    @Param('id') id: string,
    @Body() assignDriverDto: AssignDriverDto,
    @Request() req,
  ) {
    return this.ordersService.assignDriver(id, assignDriverDto, req.user);
  }
}
