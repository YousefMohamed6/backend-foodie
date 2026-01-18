import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSpecialDiscountDto } from './dto/create-special-discount.dto';
import { ValidateSpecialDiscountDto } from './dto/validate-coupon.dto';
import { SpecialDiscountsService } from './special-discounts.service';

@ApiTags('Special Discounts')
@Controller('special-discounts')
export class SpecialDiscountsController {
    constructor(private readonly specialDiscountsService: SpecialDiscountsService) { }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Create or update special discount' })
    createOrUpdate(@Body() createDto: CreateSpecialDiscountDto, @Request() req) {
        return this.specialDiscountsService.createOrUpdate(req.user.id, createDto);
    }

    @Get()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Get special discount' })
    findOne(@Request() req) {
        return this.specialDiscountsService.findOne(req.user.id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Update specific special discount' })
    update(@Param('id') id: string, @Body() dto: Partial<CreateSpecialDiscountDto['discount'][0]>, @Request() req) {
        return this.specialDiscountsService.update(req.user.id, id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR)
    @ApiOperation({ summary: 'Delete specific special discount' })
    remove(@Param('id') id: string, @Request() req) {
        return this.specialDiscountsService.remove(req.user.id, id);
    }

    @Post('validate')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Validate a coupon code (Customer only)' })
    @ApiBody({ type: ValidateSpecialDiscountDto })
    validate(@Body() dto: ValidateSpecialDiscountDto) {
        return this.specialDiscountsService.validateCoupon(dto);
    }
}
