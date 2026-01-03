import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DriversService } from '../drivers/drivers.service';
import { UpdateDriverDto } from '../drivers/dto/update-driver.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly driversService: DriversService,
    private readonly usersService: UsersService,
  ) {}

  @Get('drivers')
  @ApiOperation({ summary: 'Get all drivers for admin' })
  getDrivers(@Query('available') available?: boolean) {
    if (available) {
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
}
