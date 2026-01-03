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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  SetWithdrawMethodDto,
  TopUpWalletDto,
  WithdrawWalletDto,
} from './dto/wallet.dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  getBalance(@Request() req) {
    return this.walletService.getBalance(req.user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getTransactions(@Request() req, @Query() query) {
    return this.walletService.getTransactions(req.user.id, query);
  }

  @Post('topup')
  @ApiOperation({ summary: 'Top up wallet' })
  topUp(@Body() topUpDto: TopUpWalletDto, @Request() req) {
    return this.walletService.topUp(req.user.id, topUpDto);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw from wallet' })
  withdraw(@Body() withdrawDto: WithdrawWalletDto, @Request() req) {
    return this.walletService.withdraw(req.user.id, withdrawDto);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Get withdrawal history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getWithdrawals(@Request() req, @Query() query) {
    return this.walletService.getWithdrawals(req.user.id, query);
  }

  @Get('withdraw-method')
  @ApiOperation({ summary: 'Get withdraw method' })
  getWithdrawMethod(@Request() req) {
    return this.walletService.getWithdrawMethod(req.user.id);
  }

  @Post('withdraw-method')
  @ApiOperation({ summary: 'Set withdraw method' })
  setWithdrawMethod(@Request() req, @Body() data: SetWithdrawMethodDto) {
    return this.walletService.setWithdrawMethod(req.user.id, data);
  }

  @Get('transactions/filter')
  @ApiOperation({ summary: 'Filter wallet transactions' })
  @ApiQuery({ name: 'start', required: true })
  @ApiQuery({ name: 'end', required: true })
  getFilterTransactions(
    @Request() req,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.walletService.getFilterWalletTransaction(
      req.user.id,
      new Date(start),
      new Date(end),
    );
  }
}
