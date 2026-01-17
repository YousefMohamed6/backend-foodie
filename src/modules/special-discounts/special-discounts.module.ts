import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SpecialDiscountsController } from './special-discounts.controller';
import { SpecialDiscountsService } from './special-discounts.service';

@Module({
    imports: [PrismaModule],
    controllers: [SpecialDiscountsController],
    providers: [SpecialDiscountsService],
    exports: [SpecialDiscountsService],
})
export class SpecialDiscountsModule { }
