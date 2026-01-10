import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as Prisma from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoriesService } from './stories.service';

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) { }

  @Get()
  @ApiOperation({ summary: 'Get all stories' })
  findAll(
    @Query('vendorId') vendorId?: string,
    @CurrentUser() user?: Prisma.User,
  ) {
    return this.storiesService.findAll(vendorId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a story by ID' })
  findOne(@Param('id') id: string) {
    return this.storiesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.VENDOR)
  @ApiOperation({ summary: 'Create a new story' })
  create(@Body() createStoryDto: CreateStoryDto, @Request() req) {
    return this.storiesService.create(req.user, createStoryDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.VENDOR, Prisma.UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a story' })
  remove(@Param('id') id: string, @Request() req) {
    return this.storiesService.remove(id, req.user);
  }
}
