import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoriesService {
  constructor(
    private prisma: PrismaService,
    private readonly vendorsService: VendorsService,
  ) { }

  async findAll(vendorId?: string) {
    const where: Prisma.StoryWhereInput = { isActive: true };
    if (vendorId) where.vendorId = vendorId;
    return this.prisma.story.findMany({
      where,
      include: { vendor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: { vendor: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    return story;
  }

  async create(user: User, data: CreateStoryDto) {
    const vendor = await this.vendorsService.findByAuthor(user.id);
    if (!vendor) {
      throw new ForbiddenException('Only vendors can create stories');
    }
    return this.prisma.story.create({
      data: {
        ...data,
        vendorId: vendor.id,
      },
    });
  }

  async remove(id: string, user: User) {
    const story = await this.findOne(id);
    const vendor = await this.vendorsService.findByAuthor(user.id);
    if (
      user.role !== UserRole.ADMIN &&
      (!vendor || story.vendorId !== vendor.id)
    ) {
      throw new ForbiddenException('You cannot delete this story');
    }
    return this.prisma.story.delete({ where: { id } });
  }
}
