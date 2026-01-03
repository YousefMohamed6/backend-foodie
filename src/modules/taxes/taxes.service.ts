import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaxDto } from './dto/create-tax.dto';

@Injectable()
export class TaxesService {
  constructor(private prisma: PrismaService) {}

  async findAll(country?: string) {
    const where: Prisma.TaxWhereInput = { isActive: true };
    if (country) {
      where.country = country;
    }
    return this.prisma.tax.findMany({ where });
  }

  async create(createTaxDto: CreateTaxDto) {
    return this.prisma.tax.create({ data: createTaxDto });
  }
}
