import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LanguagesSeederService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const count = await this.prisma.language.count();
    if (count > 0) return;

    const languages = [
      { code: 'en', name: 'English', isActive: true },
      { code: 'ar', name: 'Arabic', isActive: true },
      { code: 'es', name: 'Spanish', isActive: true },
      { code: 'fr', name: 'French', isActive: true },
    ];

    await this.prisma.language.createMany({ data: languages });
    console.log('Languages seeded');
  }
}
