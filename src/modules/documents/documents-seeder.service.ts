import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DocumentsSeederService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const count = await this.prisma.document.count();
    if (count > 0) return;

    const documents = [
      {
        title: 'Driving License',
        frontSide: true,
        backSide: true,
        expireAt: true,
        enable: true,
      },
      {
        title: 'National ID',
        frontSide: true,
        backSide: true,
        expireAt: false,
        enable: true,
      },
      {
        title: 'Vehicle Registration',
        frontSide: true,
        backSide: true,
        expireAt: true,
        enable: true,
      },
    ];

    await this.prisma.document.createMany({ data: documents });
    console.log('Documents seeded');
  }
}
