import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole, type User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { FindAllCouponsQueryDto } from './dto/find-all-coupons-query.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@ApiTags('Coupons')
@ApiBearerAuth()
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Create a coupon' })
  create(@Body() createCouponDto: CreateCouponDto, @CurrentUser() user: User) {
    return this.couponsService.create(createCouponDto, user);
  }

  @Get('home')
  @ApiOperation({ summary: 'Get all public coupons for home' })
  findHome() {
    return this.couponsService.findAll({ isPublic: true });
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all coupons' })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean })
  @ApiQuery({ name: 'vendorId', required: false })
  findAll(
    @Query() query: FindAllCouponsQueryDto,
    @CurrentUser() user?: User,
  ) {
    return this.couponsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get coupon by ID' })
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Update a coupon' })
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Delete a coupon' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.couponsService.remove(id, user);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon for order' })
  validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validate(
      dto.code,
      dto.vendorId || null,
      dto.orderAmount,
    );
  }
}
