import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { OnBoardingController } from './onboarding.controller';
import { OnBoardingService } from './onboarding.service';

@Module({
  imports: [PrismaModule],
  controllers: [OnBoardingController],
  providers: [OnBoardingService],
  exports: [OnBoardingService],
})
export class OnBoardingModule {}
