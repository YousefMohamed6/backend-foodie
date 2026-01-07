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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RedeemReferralDto } from './dto/referral.dto';
import { ReferralsService } from './referrals.service';

@ApiTags('Referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) { }

  @Get('my-code')
  @ApiOperation({ summary: 'Get user referral code' })
  getReferralCode(@Request() req) {
    return this.referralsService.getReferralCode(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get referral history' })
  getHistory(@Request() req) {
    return this.referralsService.getHistory(req.user.id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply a referral code' })
  apply(@Body() redeemDto: RedeemReferralDto, @Request() req) {
    return this.referralsService.redeem(req.user.id, redeemDto);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a referral code (alias for apply)' })
  redeem(@Body() redeemDto: RedeemReferralDto, @Request() req) {
    return this.referralsService.redeem(req.user.id, redeemDto);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate referral code' })
  validate(@Body('code') code: string) {
    return this.referralsService.validateCode(code);
  }

  @Get('user/:code')
  @ApiOperation({ summary: 'Get user by referral code' })
  getUserByCode(@Param('code') code: string) {
    return this.referralsService.getUserByReferralCode(code);
  }
}
