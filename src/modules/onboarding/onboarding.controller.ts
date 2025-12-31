import { Controller, Get, Query } from '@nestjs/common';
import { OnBoarding } from '@prisma/client';
import { OnBoardingService } from './onboarding.service';

@Controller('onboarding')
export class OnBoardingController {
  constructor(private readonly onBoardingService: OnBoardingService) {}

  @Get()
  async findAll(@Query('appType') appType: string): Promise<OnBoarding[]> {
    return this.onBoardingService.findAll(appType);
  }
}
