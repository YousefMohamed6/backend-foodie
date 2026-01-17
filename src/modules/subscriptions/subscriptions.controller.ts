import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  @Post('create')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create subscription plan (Admin Only)' })
  create(@Body() createDto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.create(createDto);
  }

  @Get('plans')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get subscription plans' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get plan details' })
  getPlan(@Param('id') id: string) {
    return this.subscriptionsService.getPlan(id);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get subscription history' })
  getHistory(@Request() req) {
    return this.subscriptionsService.getHistory(req.user.id);
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Subscribe to a plan' })
  subscribe(@Body() subscribeDto: SubscribeDto, @Request() req) {
    return this.subscriptionsService.subscribe(req.user.id, subscribeDto);
  }
}
