import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';

@Injectable()
export class StoriesService {
  constructor(
    private prisma: PrismaService,
    private readonly vendorsService: VendorsService,
  ) { }

  async findAll(vendorId?: string, user?: User) {
    const where: Prisma.StoryWhereInput = { isActive: true };
    if (vendorId) where.vendorId = vendorId;

    if (user?.role === UserRole.CUSTOMER && user.zoneId) {
      where.vendor = { zoneId: user.zoneId };
    }

    return this.prisma.story.findMany({
      where,
      include: { vendor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all stories for the authenticated vendor.
   * Returns empty array if no vendor found or no stories exist.
   */
  async findMyStories(user: User) {
    const vendor = await this.vendorsService.findByAuthor(user.id);
    if (!vendor) {
      return [];
    }

    return this.prisma.story.findMany({
      where: { vendorId: vendor.id, isActive: true },
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
      throw new NotFoundException('STORY_NOT_FOUND');
    }
    return story;
  }

  async create(user: User, data: CreateStoryDto) {
    const vendor = await this.vendorsService.findByAuthor(user.id);
    if (!vendor) {
      throw new ForbiddenException('FORBIDDEN');
    }
    return Promise.all(
      data.videoUrl.map((url) =>
        this.prisma.story.create({
          data: {
            vendorId: vendor.id,
            mediaUrl: url,
            videoThumbnail: data.videoThumbnail,
            mediaType: 'video',
            isActive: true,
          },
        }),
      ),
    );
  }

  async remove(id: string, user: User) {
    const story = await this.findOne(id);
    const vendor = await this.vendorsService.findByAuthor(user.id);
    if (
      user.role !== UserRole.ADMIN &&
      (!vendor || story.vendorId !== vendor.id)
    ) {
      throw new ForbiddenException('STORY_DELETE_PERMISSION');
    }
    return this.prisma.story.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async update(id: string, user: User, data: UpdateStoryDto) {
    const story = await this.findOne(id);
    const vendor = await this.vendorsService.findByAuthor(user.id);

    if (!vendor || story.vendorId !== vendor.id) {
      throw new ForbiddenException('STORY_UPDATE_PERMISSION');
    }

    const updateData: Prisma.StoryUpdateInput = {
      videoThumbnail: data.videoThumbnail,
    };

    if (data.mediaUrl) {
      updateData.mediaUrl = data.mediaUrl;
    } else if (data.videoUrl && data.videoUrl.length > 0) {
      updateData.mediaUrl = data.videoUrl[0];
    }

    return this.prisma.story.update({
      where: { id },
      data: updateData,
    });
  }
}
