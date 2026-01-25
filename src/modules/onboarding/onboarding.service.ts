import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnBoardingService {
  constructor(private prisma: PrismaService) { }

  async findAll(appType?: string) {
    const where: any = {};
    if (appType) {
      // Validate if appType is one of the enum values
      const validTypes = ['customerApp', 'driverApp', 'vendorApp', 'mangerApp'];
      if (validTypes.includes(appType)) {
        where.type = appType;
      }
    }
    return this.prisma.onBoarding.findMany({
      where,
    });
  }
}
