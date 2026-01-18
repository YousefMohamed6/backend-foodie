import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { VendorsService } from '../vendors/vendors.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private vendorsService: VendorsService,
    private redis: RedisService,
  ) { }



  async create(createCategoryDto: CreateCategoryDto, user: User) {
    let vendorId = createCategoryDto.vendorId;

    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      if (!vendor) {
        throw new NotFoundException('VENDOR_NOT_FOUND');
      }
      vendorId = vendor.id;
    }

    // Prisma Create
    // const { reviewAttributes, ...rest } = createCategoryDto; 
    // Since reviewAttributes is not in DTO anymore, we skip it or handle it if we cast. 
    // We will assume it's not passed for now to satisfy TS.

    const result = await this.prisma.category.create({
      data: {
        englishName: createCategoryDto.englishName,
        arabicName: createCategoryDto.arabicName,
        image: createCategoryDto.image,
        description: createCategoryDto.description,
        isActive: false,
        showOnHome: false,
        vendorId,
      },
      include: {
        products: true,
      },
    });
    await this.redis.delPattern('categories:all:*');
    return result;
  }

  async findAll(query: {
    vendorId?: string;
    home?: string | boolean;
    showInHomepage?: string | boolean;
    page?: number | string;
    limit?: number | string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = { isActive: true };
    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }
    // Support both 'home' and 'showInHomepage' query params
    if (query.home !== undefined) {
      where.showOnHome = query.home === 'true' || query.home === true;
    }
    if (query.showInHomepage !== undefined) {
      where.showOnHome =
        query.showInHomepage === 'true' || query.showInHomepage === true;
    }
    const cacheKey = `categories:all:${query.vendorId || 'global'}:${query.home}:${query.showInHomepage}:p${page}:l${limit}`;

    // Try to get from cache
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where,
      skip,
      take: limit,
      include: {
        products: true,
      },
    });

    // Cache the result
    await this.redis.set(cacheKey, categories, 1800); // 30 mins

    return categories;
  }

  /**
   * Get product categories that belong to vendors matching the authenticated vendor's category IDs
   * @param user The authenticated vendor user
   */
  async findByVendorCategories(user: User) {
    // Get the vendor and their categories directly
    const vendor = await this.prisma.vendor.findUnique({
      where: { authorId: user.id },
      include: {
        categories: {
          where: { isActive: true },
          include: {
            products: true,
          },
          orderBy: {
            arabicName: 'asc',
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('VENDOR_NOT_FOUND');
    }

    return vendor.categories;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
    if (!category) {
      throw new NotFoundException('NOT_FOUND');
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, user: User) {
    const category = await this.findOne(id);

    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      if (category.vendorId !== vendor?.id) {
        throw new ForbiddenException('FORBIDDEN');
      }
    }

    // const { reviewAttributes, ...rest } = updateCategoryDto;
    // reviewAttributes removed from DTO

    const result = await this.prisma.category.update({
      where: { id },
      data: {
        englishName: updateCategoryDto.englishName,
        arabicName: updateCategoryDto.arabicName,
        image: updateCategoryDto.image,
        description: updateCategoryDto.description,
      },
      include: {
        products: true,
      },
    });
    await this.redis.delPattern('categories:all:*');
    return result;
  }

  async remove(id: string, user: User) {
    const category = await this.findOne(id);

    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      if (category.vendorId !== vendor?.id) {
        throw new ForbiddenException('FORBIDDEN');
      }
    }

    const result = await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    await this.redis.delPattern('categories:all:*');
    return result;
  }
}
