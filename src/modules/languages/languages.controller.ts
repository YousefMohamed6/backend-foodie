import { Controller, Get } from '@nestjs/common';
import { Language } from '@prisma/client';
import { LanguagesService } from './languages.service';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  async findAll(): Promise<Language[]> {
    return this.languagesService.findAll();
  }
}
