import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { extras: true; itemAttributes: true };
}>;

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => VendorsService))
    private vendorsService: VendorsService,
  ) { }

  async create(createProductDto: CreateProductDto, user: User) {
    const vendor = await this.vendorsService.findByAuthor(user.id);
    if (!vendor) {
      throw new NotFoundException('VENDOR_NOT_FOUND');
    }

    await this.validateProductPrice(
      createProductDto.price,
      createProductDto.discountPrice,
    );

    const { extras, itemAttributes, ...productData } = createProductDto;

    // Normalize itemAttributes string to relational objects
    const attributeData = this.parseItemAttributes(itemAttributes);

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        vendorId: vendor.id,
        extras: extras ? { create: extras } : undefined,
        itemAttributes: attributeData ? { create: attributeData } : undefined,
      },
      include: { extras: true, itemAttributes: true },
    });

    return this.mapProductResponse(product);
  }

  async findAll(query: {
    vendorId?: string;
    categoryId?: string;
    publish?: string | boolean;
    foodType?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.publish !== undefined)
      where.isActive = query.publish === 'true' || query.publish === true;

    // Filter by food type (TakeAway or DineIn)
    if (query.foodType) {
      if (query.foodType === 'DineIn') {
        where.takeawayOption = false;
      }
    }

    const products = await this.prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: { extras: true, itemAttributes: true },
    });

    return products.map((p) => this.mapProductResponse(p));
  }

  async count(query: { vendorId?: string }) {
    const where: Prisma.ProductWhereInput = {};
    if (query.vendorId) where.vendorId = query.vendorId;
    return this.prisma.product.count({ where });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { vendor: true, extras: true, itemAttributes: true },
    });
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }
    return this.mapProductResponse(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    const vendor = await this.vendorsService.findByAuthor(user.id);

    if (!vendor || product.vendorId !== vendor.id) {
      throw new ForbiddenException('FORBIDDEN');
    }

    // Validate price if provided
    if (
      updateProductDto.price !== undefined ||
      updateProductDto.discountPrice !== undefined
    ) {
      const newPrice =
        updateProductDto.price !== undefined
          ? updateProductDto.price
          : Number(product.price);
      const newDiscountPrice =
        updateProductDto.discountPrice !== undefined
          ? updateProductDto.discountPrice
          : product.discountPrice
            ? Number(product.discountPrice)
            : undefined;

      await this.validateProductPrice(newPrice, newDiscountPrice);
    }

    const { extras, itemAttributes, ...updateData } = updateProductDto;

    const attributeData = this.parseItemAttributes(itemAttributes);

    const savedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        extras: extras
          ? {
            deleteMany: {},
            create: extras,
          }
          : undefined,
        itemAttributes:
          itemAttributes !== undefined
            ? {
              deleteMany: {},
              create: attributeData || [],
            }
            : undefined,
      },
      include: { extras: true, itemAttributes: true },
    });

    return this.mapProductResponse(savedProduct);
  }

  async remove(id: string, user: User) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }
    const vendor = await this.vendorsService.findByAuthor(user.id);

    if (!vendor || product.vendorId !== vendor.id) {
      throw new ForbiddenException('FORBIDDEN');
    }

    return this.prisma.product.delete({ where: { id } });
  }

  async search(query: string, page?: string | number, limit?: string | number) {
    const p = Number(page) || 1;
    const l = Math.min(Number(limit) || 20, 100);
    const skip = (p - 1) * l;

    const products = await this.prisma.product.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: { extras: true, itemAttributes: true },
      skip,
      take: l,
    });
    return products.map((p) => this.mapProductResponse(p));
  }

  private async validateProductPrice(price: number, discountPrice?: number) {
    if (price <= 0) {
      throw new BadRequestException('PRICE_NON_POSITIVE');
    }

    if (discountPrice !== undefined && discountPrice !== null) {
      if (discountPrice <= 0) {
        throw new BadRequestException('DISCOUNT_PRICE_NON_POSITIVE');
      }
      if (discountPrice >= price) {
        throw new BadRequestException('DISCOUNT_EXCEEDS_PRICE');
      }
    }

    const maxPriceSetting = await this.prisma.setting.findUnique({
      where: { key: 'max_product_price' },
    });

    if (maxPriceSetting && maxPriceSetting.value) {
      const maxPrice = Number(maxPriceSetting.value);
      if (!isNaN(maxPrice) && price > maxPrice) {
        throw new BadRequestException('PRICE_EXCEEDS_MAX');
      }
    }
  }

  private parseItemAttributes(
    attrString?: string,
  ): { key: string; value: string }[] | null {
    if (!attrString) return null;
    try {
      // Try parsing as JSON array
      const parsed = JSON.parse(attrString);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value),
        }));
      }
    } catch {
      // Fallback: split by comma if it looks like key:value
      return attrString
        .split(',')
        .map((pair) => {
          const [key, value] = pair.split(':');
          return { key: key?.trim(), value: value?.trim() || '' };
        })
        .filter((p) => p.key);
    }
    return [{ key: 'label', value: attrString }];
  }

  private mapProductResponse(product: ProductWithRelations | null) {
    if (!product) return null;
    const { itemAttributes, ...rest } = product;

    // Map relational attributes back to a JSON string to preserve response shape
    const attributesObj = (itemAttributes || []).reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return {
      ...rest,
      itemAttributes:
        Object.keys(attributesObj).length > 0
          ? JSON.stringify(attributesObj)
          : null,
    };
  }
}
