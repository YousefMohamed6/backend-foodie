import { Controller, Get, Param } from '@nestjs/common';
import { ReviewAttribute } from '@prisma/client';
import { ReviewAttributesService } from './review-attributes.service';

@Controller('review-attributes')
export class ReviewAttributesController {
  constructor(
    private readonly reviewAttributesService: ReviewAttributesService,
  ) {}

  @Get()
  async findAll(): Promise<ReviewAttribute[]> {
    return this.reviewAttributesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ReviewAttribute | null> {
    return this.reviewAttributesService.findOne(id);
  }
}
