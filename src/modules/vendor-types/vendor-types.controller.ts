import { Controller, Get } from '@nestjs/common';
import { VendorType } from '@prisma/client';
import { VendorTypesService } from './vendor-types.service';

@Controller('vendor-types')
export class VendorTypesController {
  constructor(private readonly vendorTypesService: VendorTypesService) {}

  @Get()
  async findAll(): Promise<VendorType[]> {
    return this.vendorTypesService.findAll();
  }
}
