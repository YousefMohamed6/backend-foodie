import { Module } from '@nestjs/common';
import { LanguagesSeederService } from '../../../scripts/seed-languages';
import { PrismaModule } from '../../prisma/prisma.module';
import { LanguagesController } from './languages.controller';
import { LanguagesService } from './languages.service';

@Module({
  imports: [PrismaModule],
  controllers: [LanguagesController],
  providers: [LanguagesService, LanguagesSeederService],
  exports: [LanguagesService],
})
export class LanguagesModule { }
