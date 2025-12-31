import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LanguagesSeederService } from './languages-seeder.service';
import { LanguagesController } from './languages.controller';
import { LanguagesService } from './languages.service';

@Module({
  imports: [PrismaModule],
  controllers: [LanguagesController],
  providers: [LanguagesService, LanguagesSeederService],
  exports: [LanguagesService],
})
export class LanguagesModule {}
