import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CurrenciesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.currency.findMany({ where: { isActive: true } });
  }

  async findCurrent() {
    // Logic to find current currency (e.g., default or first active)
    return this.prisma.currency.findFirst({ where: { isActive: true } });
  }
}
