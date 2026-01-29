import {
  Body,
  Controller,
  Get,
  Param,
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
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  GetTransactionsQueryDto,
  GetWithdrawalsQueryDto,
} from './dto/get-transactions-query.dto';
import {
  SetWithdrawMethodDto,
  WithdrawWalletDto,
} from './dto/wallet.dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiQuery({ name: 'transactionUser', required: false, description: 'Filter by user role types (customer, driver, vendor)' })
  getBalance(@Request() req, @Query('transactionUser') transactionUser?: string) {
    return this.walletService.getBalance(req.user.id, transactionUser);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getTransactions(@Request() req, @Query() query: GetTransactionsQueryDto) {
    return this.walletService.getTransactions(req.user.id, query);
  }

  @Get('topup/:id/status')
  @ApiOperation({ summary: 'Get topup status' })
  getTopUpStatus(@Param('id') id: string, @Request() req) {
    return this.walletService.getTopUpStatus(req.user.id, id);
  }

  @Post('withdraw')
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Withdraw from wallet' })
  withdraw(@Body() withdrawDto: WithdrawWalletDto, @Request() req) {
    return this.walletService.withdraw(req.user.id, withdrawDto);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Get withdrawal history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getWithdrawals(@Request() req, @Query() query: GetWithdrawalsQueryDto) {
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
