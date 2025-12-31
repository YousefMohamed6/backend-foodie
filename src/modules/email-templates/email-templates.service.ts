import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findByType(type: string) {
    return this.prisma.emailTemplate.findFirst({ where: { type } });
  }
}
