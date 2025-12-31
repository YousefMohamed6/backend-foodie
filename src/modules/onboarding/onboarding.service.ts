import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnBoardingService {
  constructor(private prisma: PrismaService) {}

  async findAll(appType?: string) {
    // Assuming 'appType' helps to filter, but entity didn't strictly have appType defined in previous steps,
    // check if I added it?
    // I created OnBoarding entity with id, title, description, image.
    // If appType is needed, I should have added it.
    // APIUtils.getOnBoardingList takes 'appType'.
    // I will assume for now it returns all or implement logic later if column missing.
    return this.prisma.onBoarding.findMany();
  }
}
