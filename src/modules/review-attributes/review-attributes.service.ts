import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewAttributesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.reviewAttribute.findMany();
  }

  async findOne(id: string) {
    return this.prisma.reviewAttribute.findUnique({ where: { id } });
  }
}
