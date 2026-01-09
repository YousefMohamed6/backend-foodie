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
import { PrismaService } from '../../prisma/prisma.service';
import { DriversService } from '../drivers/drivers.service';
import { UpdateDriverDto } from '../drivers/dto/update-driver.dto';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { GetDriversQueryDto } from './dto/get-drivers-query.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly driversService: DriversService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('drivers')
  @ApiOperation({ summary: 'Get all drivers for admin' })
  getDrivers(@Query() query: GetDriversQueryDto) {
    if (query.available) {
      return this.driversService.findAvailable();
    }
    return this.driversService.findAll();
  }

  @Patch('drivers/:id')
  @ApiOperation({ summary: 'Update driver profile' })
  updateDriver(@Param('id') id: string, @Body() data: UpdateDriverDto) {
    return this.driversService.update(id, data);
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get all driver documents for verification' })
  getDocuments() {
    return this.driversService.getAllDocuments();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  getUsers() {
    return this.usersService.findAll();
  }

  @Get('cash-confirmations')
  @ApiOperation({
    summary: 'Get all manager cash receipt confirmations (Admin only)',
  })
  getCashConfirmations() {
    return this.prisma.managerCashConfirmation.findMany({
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        order: {
          select: { id: true, totalAmount: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('managers/:managerId/confirm-payout')
  @ApiOperation({
    summary: 'Admin confirms receiving cash from a manager for a specific day',
  })
  @ApiQuery({
    name: 'date',
    description: 'Date in YYYY-MM-DD format',
    required: true,
  })
  confirmManagerPayout(
    @Param('managerId') managerId: string,
    @Query('date') date: string,
    @Request() req,
  ) {
    return this.ordersService.confirmManagerPayout(managerId, date, req.user);
  }
}
