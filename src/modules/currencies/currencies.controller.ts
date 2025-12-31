import { Controller, Get } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { CurrenciesService } from './currencies.service';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get('current')
  async findCurrent(): Promise<Currency | null> {
    return this.currenciesService.findCurrent();
  }

  @Get()
  async findAll(): Promise<Currency[]> {
    return this.currenciesService.findAll();
  }
}
