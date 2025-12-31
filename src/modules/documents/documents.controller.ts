import { Controller, Get } from '@nestjs/common';
import { Document } from '@prisma/client';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async findAll(): Promise<Document[]> {
    return this.documentsService.findAll();
  }
}
