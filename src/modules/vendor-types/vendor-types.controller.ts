import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorType } from '@prisma/client';
import { VendorTypesService } from './vendor-types.service';

@ApiTags('Vendor Types')
@Controller('vendor-types')
export class VendorTypesController {
  constructor(private readonly vendorTypesService: VendorTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vendor types' })
  async findAll(): Promise<VendorType[]> {
    return this.vendorTypesService.findAll();
  }
}
