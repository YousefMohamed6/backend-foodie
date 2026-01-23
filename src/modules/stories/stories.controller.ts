import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as Prisma from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
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

  @Get('customer/zone')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get stories from vendors in the customer zone' })
  findInMyZone(@CurrentUser() user: Prisma.User) {
    return this.storiesService.findAll(undefined, user);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.VENDOR)
  @ApiOperation({ summary: 'Get stories for authenticated vendor' })
  findMyStories(@Request() req) {
    return this.storiesService.findMyStories(req.user);
  }


  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.VENDOR)
  @ApiOperation({ summary: 'Create a new story' })
  create(@Body() createStoryDto: CreateStoryDto, @Request() req) {
    return this.storiesService.create(req.user, createStoryDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.VENDOR)
  @ApiOperation({ summary: 'Update a story' })
  update(
    @Param('id') id: string,
    @Body() updateStoryDto: UpdateStoryDto,
    @Request() req,
  ) {
    return this.storiesService.update(id, req.user, updateStoryDto);
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
