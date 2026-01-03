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
import { PurchaseGiftCardDto, RedeemGiftCardDto } from './dto/gift-card.dto';
import { GiftCardsService } from './gift-cards.service';

@ApiTags('Gift Cards')
@Controller('gift-cards')
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active gift card templates' })
  findAll() {
    return this.giftCardsService.findAll();
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user gift card history' })
  getHistory(@Request() req) {
    return this.giftCardsService.getMyCards(req.user.id);
  }

  @Get('my-cards')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get user purchased gift cards (alias for history)',
  })
  getMyCards(@Request() req) {
    return this.giftCardsService.getMyCards(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gift card template details' })
  findOne(@Param('id') id: string) {
    return this.giftCardsService.findOne(id);
  }

  @Post('purchase')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Purchase a gift card' })
  purchase(@Body() purchaseDto: PurchaseGiftCardDto, @Request() req) {
    return this.giftCardsService.purchase(req.user.id, purchaseDto);
  }

  @Post('redeem')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Redeem a gift card' })
  redeem(@Body() redeemDto: RedeemGiftCardDto, @Request() req) {
    return this.giftCardsService.redeem(req.user.id, redeemDto);
  }

  @Get('check-code/:code')
  @ApiOperation({ summary: 'Check gift card code' })
  checkCode(@Param('code') code: string) {
    return this.giftCardsService.checkCode(code);
  }
}
