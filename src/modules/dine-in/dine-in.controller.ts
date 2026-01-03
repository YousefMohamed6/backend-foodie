import {
  Body,
  Controller,
  Get,
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
import { DineInBooking } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DineInService } from './dine-in.service';
import { CreateDineInBookingDto } from './dto/create-dine-in-booking.dto';

@ApiTags('Dine-In Bookings')
@Controller('dine-in-bookings')
export class DineInController {
  constructor(private readonly dineInService: DineInService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a dine-in booking' })
  async create(
    @Body() createDineInBookingDto: CreateDineInBookingDto,
    @Request() req,
  ): Promise<DineInBooking> {
    return this.dineInService.create({
      ...createDineInBookingDto,
      authorId: req.user.id,
    });
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user dine-in bookings' })
  @ApiQuery({
    name: 'isUpcoming',
    required: false,
    type: Boolean,
    description: 'Filter by upcoming (true) or past (false) bookings',
  })
  async findAll(
    @Query() query: { isUpcoming?: string | boolean },
    @Request() req,
  ): Promise<DineInBooking[]> {
    return this.dineInService.findAll(req.user.id, query);
  }
}
