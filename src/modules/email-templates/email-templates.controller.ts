import { Controller, Get, Query } from '@nestjs/common';
import { EmailTemplate } from '@prisma/client';
import { EmailTemplatesService } from './email-templates.service';

@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Get()
  async findByType(@Query('type') type: string): Promise<EmailTemplate | null> {
    return this.emailTemplatesService.findByType(type);
  }
}
