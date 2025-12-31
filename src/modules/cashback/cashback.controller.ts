import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CashbackService } from './cashback.service';

@ApiTags('Cashback')
@Controller('cashback')
export class CashbackController {
  constructor(private readonly cashbackService: CashbackService) {}

  @Get()
  @ApiOperation({ summary: 'Get available cashbacks' })
  findAll() {
    return this.cashbackService.findAll();
  }

  @Get(':id/redeemed')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get redeemed cashbacks for current user' })
  getRedeemed(@Param('id') id: string, @Request() req) {
    return this.cashbackService.getRedeemed(id, req.user.id);
  }

  @Get(':id/redeems')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user redemption history for cashback (alias for /redeemed)' })
  getRedeemHistory(@Param('id') id: string, @Request() req) {
    return this.cashbackService.getRedeemed(id, req.user.id);
  }
}
