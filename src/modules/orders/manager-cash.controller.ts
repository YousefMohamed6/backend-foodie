import {
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
import { OrdersService } from './orders.service';

@ApiTags('Manager Cash Flow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('manager')
export class ManagerCashController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get('orders/pending-cash')
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get all COD orders pending cash for manager (Zone restricted)',
  })
  getPendingCashOrders(@Request() req) {
    return this.ordersService.getManagerPendingCashOrders(req.user);
  }

  @Post('orders/:orderId/confirm-cash')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Manager confirms cash receipt for a single order' })
  confirmCashReceipt(@Param('orderId') orderId: string, @Request() req) {
    return this.ordersService.confirmCashReceipt(orderId, req.user);
  }

  @Get('cash-on-hand')
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get total cash on hand for manager (collected - paid out)',
  })
  getCashOnHand(@Request() req) {
    return this.ordersService.getManagerCashOnHand(req.user);
  }

  @Get('cash-summary')
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get summary of confirmed cash for a manager on a date',
  })
  @ApiQuery({
    name: 'date',
    description: 'Date in YYYY-MM-DD format',
    required: true,
  })
  getCashSummary(@Query('date') date: string, @Request() req) {
    return this.ordersService.getManagerCashSummary(req.user, date);
  }

  @Get('cash-history')
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get full history of confirmed cash collections for a manager',
  })
  getCashHistory(@Request() req) {
    return this.ordersService.getManagerCashHistory(req.user);
  }
}
