import { Controller, Get, Query } from '@nestjs/common';
import { Tax } from '@prisma/client';
import { TaxesService } from './taxes.service';

@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  async findAll(@Query('country') country: string): Promise<Tax[]> {
    return this.taxesService.findAll(country);
  }
}
