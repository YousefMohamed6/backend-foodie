import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private vendorsService: VendorsService,
  ) { }

  async create(createCategoryDto: CreateCategoryDto, user: User) {
    let vendorId = createCategoryDto.vendorId;

    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      if (!vendor) {
        throw new NotFoundException('Vendor profile not found');
      }
      vendorId = vendor.id;
    }

    // Prisma Create
    const { reviewAttributes, ...rest } = createCategoryDto;

    // Normalize reviewAttributes to IDs
    let attributeIds: string[] = [];
    if (reviewAttributes && Array.isArray(reviewAttributes)) {
      attributeIds = reviewAttributes.map((attr) =>
        typeof attr === 'string' ? attr : attr.id
      ).filter(Boolean);
    }

    return this.prisma.category.create({
      data: {
        ...rest,
        isActive: rest.isActive ?? true,
        showOnHome: rest.showOnHome ?? false,
        vendorId,
        reviewAttributes: attributeIds.length > 0 ? {
          connect: attributeIds.map((id) => ({ id })),
        } : undefined,
      },
      include: {
        products: true,
        reviewAttributes: true,
      },
    });
  }

  findAll(query: { vendorId?: string; home?: string | boolean; showInHomepage?: string | boolean }) {
    const where: Prisma.CategoryWhereInput = {};
    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }
    // Support both 'home' and 'showInHomepage' query params
    if (query.home !== undefined) {
      where.showOnHome = query.home === 'true' || query.home === true;
    }
    if (query.showInHomepage !== undefined) {
      where.showOnHome = query.showInHomepage === 'true' || query.showInHomepage === true;
    }
    return this.prisma.category.findMany({
      where,
      include: {
        products: true,
        reviewAttributes: true,
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
        reviewAttributes: true
      },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, user: User) {
    const category = await this.findOne(id);

    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      if (category.vendorId !== vendor?.id) {
        throw new ForbiddenException('You can only update your own categories');
      }
    }

    const { reviewAttributes, ...rest } = updateCategoryDto;

    let attributeIds: string[] = [];
    if (reviewAttributes && Array.isArray(reviewAttributes)) {
      attributeIds = reviewAttributes.map((attr) =>
        typeof attr === 'string' ? attr : attr.id
      ).filter(Boolean);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...rest,
        reviewAttributes: reviewAttributes ? {
          set: attributeIds.map((id) => ({ id })),
        } : undefined,
      },
      include: {
        products: true,
        reviewAttributes: true,
      },
    });
  }

  async remove(id: string, user: User) {
    const category = await this.findOne(id);

    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      if (category.vendorId !== vendor?.id) {
        throw new ForbiddenException('You can only delete your own categories');
      }
    }

    return this.prisma.category.delete({ where: { id } });
  }
}
