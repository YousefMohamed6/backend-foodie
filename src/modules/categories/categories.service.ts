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

  private readonly CACHE_KEY_HOME = 'categories:home';

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
    const { reviewAttributes, ...rest } = createCategoryDto;

    // Normalize reviewAttributes to IDs
    let attributeIds: string[] = [];
    if (reviewAttributes && Array.isArray(reviewAttributes)) {
      attributeIds = reviewAttributes
        .map((attr) => (typeof attr === 'string' ? attr : attr.id))
        .filter(Boolean);
    }

    const result = await this.prisma.category.create({
      data: {
        ...rest,
        isActive: rest.isActive ?? true,
        showOnHome: rest.showOnHome ?? false,
        vendorId,
        reviewAttributes:
          attributeIds.length > 0
            ? {
              connect: attributeIds.map((id) => ({ id })),
            }
            : undefined,
      },
      include: {
        products: true,
        reviewAttributes: true,
      },
    });
    await this.redis.del(this.CACHE_KEY_HOME);
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
    const cacheKey = `categories:all:${query.vendorId || 'global'}:${query.home}:${query.showInHomepage}`;

    // Only cache home categories for now as they are most hit
    const isHomeQuery =
      query.home === 'true' ||
      query.home === true ||
      query.showInHomepage === 'true' ||
      query.showInHomepage === true;

    if (isHomeQuery && !query.page && !query.limit) {
      const cached = await this.redis.get<any[]>(this.CACHE_KEY_HOME);
      if (cached) return cached;
    }

    const categories = await this.prisma.category.findMany({
      where,
      skip,
      take: limit,
      include: {
        products: true,
        reviewAttributes: true,
      },
    });

    if (isHomeQuery && !query.page && !query.limit) {
      await this.redis.set(this.CACHE_KEY_HOME, categories, 1800); // 30 mins
    }

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
            reviewAttributes: true,
          },
          orderBy: {
            name: 'asc',
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
        reviewAttributes: true,
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

    const { reviewAttributes, ...rest } = updateCategoryDto;

    let attributeIds: string[] = [];
    if (reviewAttributes && Array.isArray(reviewAttributes)) {
      attributeIds = reviewAttributes
        .map((attr) => (typeof attr === 'string' ? attr : attr.id))
        .filter(Boolean);
    }

    const result = await this.prisma.category.update({
      where: { id },
      data: {
        ...rest,
        reviewAttributes: reviewAttributes
          ? {
            set: attributeIds.map((id) => ({ id })),
          }
          : undefined,
      },
      include: {
        products: true,
        reviewAttributes: true,
      },
    });
    await this.redis.del(this.CACHE_KEY_HOME);
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
    await this.redis.del(this.CACHE_KEY_HOME);
    return result;
  }
}
