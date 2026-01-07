import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CurrenciesSeederService implements OnModuleInit {
  constructor(private prisma: PrismaService) { }

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const count = await this.prisma.currency.count();
    if (count > 0) return;

    const currencies = [
      {
        code: 'USD',
        symbol: '$',
        isActive: true,
        isAfter: false,
        decimal: 2,
        isDefault: false,
      },
      {
        code: 'EUR',
        symbol: '€',
        isActive: true,
        isAfter: true,
        decimal: 2,
        isDefault: false,
      },
      {
        code: 'EGP',
        symbol: 'EGP',
        isActive: true,
        isAfter: true,
        decimal: 2,
        isDefault: true,
      },
    ];

    await this.prisma.currency.createMany({ data: currencies });
    console.log('Currencies seeded');
  }
}
