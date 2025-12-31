import { Controller, Get } from '@nestjs/common';
import { Attribute } from '@prisma/client';
import { AttributesService } from './attributes.service';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  async findAll(): Promise<Attribute[]> {
    return this.attributesService.findAll();
  }
}
