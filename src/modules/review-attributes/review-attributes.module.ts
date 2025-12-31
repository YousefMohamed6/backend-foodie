import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReviewAttributesController } from './review-attributes.controller';
import { ReviewAttributesService } from './review-attributes.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewAttributesController],
  providers: [ReviewAttributesService],
  exports: [ReviewAttributesService],
})
export class ReviewAttributesModule {}
