import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LanguagesSeederService implements OnModuleInit {
  constructor(private prisma: PrismaService) { }

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const count = await this.prisma.language.count();
    if (count > 0) return;

    const languages = [
      {
        code: 'en',
        name: 'English',
        isActive: true,
        isRtl: false,
        isDefault: false,
        image: 'https://flagcdn.com/w320/us.png',
      },
      {
        code: 'ar',
        name: 'Arabic',
        isActive: true,
        isRtl: true,
        isDefault: true,
        image: 'https://flagcdn.com/w320/sa.png',
      },
      {
        code: 'es',
        name: 'Spanish',
        isActive: true,
        isRtl: false,
        isDefault: false,
        image: 'https://flagcdn.com/w320/es.png',
      },
      {
        code: 'fr',
        name: 'French',
        isActive: true,
        isRtl: false,
        isDefault: false,
        image: 'https://flagcdn.com/w320/fr.png',
      },
    ];

    await this.prisma.language.createMany({ data: languages });
    console.log('Languages seeded');
  }
}
