import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
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
    private redisService: RedisService,
  ) { }

  private readonly CACHE_KEYS = {
    ALL_PRODUCTS: (query: any, zoneId?: string) =>
      `products:all:${zoneId || 'no_zone'}:${JSON.stringify(query)}`,
    PRODUCT_BY_ID: (id: string) => `products:id:${id}`,
    BY_CATEGORY_ZONE: (categoryId: string, zoneId: string) =>
      `products:cat:${categoryId}:zone:${zoneId}`,
  };

  private async invalidateProductCache(
    productId?: string,
    vendorId?: string,
    zoneId?: string,
  ) {
    if (productId) {
      await this.redisService.del(this.CACHE_KEYS.PRODUCT_BY_ID(productId));
    }
    // Invalidate all product lists to ensure consistency
    await this.redisService.delPattern('products:all:*');
    await this.redisService.delPattern('products:cat:*');
  }

  async create(createProductDto: CreateProductDto, user: User) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { authorId: user.id },
      include: { subscriptionPlan: true },
    });
    if (!vendor) {
      throw new NotFoundException('VENDOR_NOT_FOUND');
    }

    if (!vendor.subscriptionPlanId) {
      throw new BadRequestException('VENDOR_SUBSCRIPTION_REQUIRED');
    }

    if (
      vendor.subscriptionExpiryDate &&
      new Date() > vendor.subscriptionExpiryDate
    ) {
      throw new BadRequestException('VENDOR_SUBSCRIPTION_EXPIRED');
    }

    // Check product limit only if plan is not free (price > 0) and limit is not unlimited (-1)
    const isFreePlan = Number(vendor.subscriptionPlan?.price || 0) === 0;
    const vendorWithLimit = vendor as any;
    const hasLimit =
      vendorWithLimit.subscriptionProductsLimit !== null &&
      vendorWithLimit.subscriptionProductsLimit !== -1;

    if (!isFreePlan && hasLimit) {
      if (
        vendorWithLimit.subscriptionProductsLimit !== null &&
        vendorWithLimit.subscriptionProductsLimit <= 0
      ) {
        throw new BadRequestException('PRODUCT_LIMIT_REACHED');
      }
    }

    await this.validateProductPrice(
      createProductDto.price,
      createProductDto.discountPrice,
    );

    // Check for duplicate product name within the same vendor
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        vendorId: vendor.id,
        name: createProductDto.name,
        isActive: true,
      },
    });
    if (existingProduct) {
      throw new BadRequestException('PRODUCT_NAME_ALREADY_EXISTS');
    }

    const { extras, itemAttributes, ...productData } = createProductDto;

    // Normalize itemAttributes string to relational objects
    const attributeData = this.parseItemAttributes(itemAttributes);

    // Use transaction to create product and decrement limit atomically if needed
    const product = await this.prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          ...productData,
          isActive: true,
          description: productData.description || '',
          vendorId: vendor.id,
          extras: extras ? { create: extras } : undefined,
          itemAttributes: attributeData ? { create: attributeData } : undefined,
        },
        include: { extras: true, itemAttributes: true },
      });

      // Decrement limit if it's a constrained paid plan
      if (
        !isFreePlan &&
        hasLimit &&
        vendorWithLimit.subscriptionProductsLimit !== null &&
        vendorWithLimit.subscriptionProductsLimit > 0
      ) {
        await tx.vendor.update({
          where: { id: vendor.id },
          data: {
            subscriptionProductsLimit: { decrement: 1 } as any,
          },
        });
      }

      return newProduct;
    });

    await this.invalidateProductCache(undefined, vendor.id, vendor.zoneId);
    return this.mapProductResponse(product);
  }

  async findAll(
    query: {
      vendorId?: string;
      categoryId?: string;
      publish?: string | boolean;
      foodType?: string;
      page?: number | string;
      limit?: number | string;
    },
    user?: User,
  ) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    const isVendor = user?.role === UserRole.VENDOR;
    const zoneId =
      user?.role === UserRole.CUSTOMER && user.zoneId ? user.zoneId : undefined;

    // Don't use cache for vendor requests - they need real-time data
    if (!isVendor) {
      const cacheKey = this.CACHE_KEYS.ALL_PRODUCTS(query, zoneId);
      const cached = await this.redisService.get<any[]>(cacheKey);
      if (cached) return cached;
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      vendor: { isActive: true },
    };

    // Vendors see all their products (published and unpublished).
    // Customers see only published products.
    if (isVendor) {
      // Get vendor's ID to filter only their products
      const vendor = await this.prisma.vendor.findUnique({
        where: { authorId: user.id },
        select: { id: true },
      });
      if (vendor) {
        where.vendorId = vendor.id;
        // Only apply publish filter if explicitly requested
        if (query.publish !== undefined && query.publish !== 'all') {
          where.isPublish = query.publish === 'true' || query.publish === true;
        }
        // If publish is undefined or 'all', return all products (published and unpublished)
      }
    } else {
      // Non-vendors (customers, guests) only see published products
      where.isPublish = true;
      if (query.vendorId) where.vendorId = query.vendorId;
    }

    if (query.categoryId) where.categoryId = query.categoryId;

    if (zoneId) {
      where.vendor = {
        isActive: true,
        zoneId: zoneId,
      };
    }

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

    const response = products.map((p) => this.mapProductResponse(p));

    // Only cache for non-vendor requests
    if (!isVendor) {
      const cacheKey = this.CACHE_KEYS.ALL_PRODUCTS(query, zoneId);
      await this.redisService.set(cacheKey, response, 300);
    }

    return response;
  }

  async findByCategoryAndZone(
    categoryId: string,
    user: User,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    if (!user.zoneId) {
      return [];
    }

    const skip = (page - 1) * limit;

    const cacheKey = `${this.CACHE_KEYS.BY_CATEGORY_ZONE(categoryId, user.zoneId)}:p${page}:l${limit}:s${search || ''}`;
    const cached = await this.redisService.get<any[]>(cacheKey);
    if (cached) return cached;

    const where: Prisma.ProductWhereInput = {
      categoryId,
      isActive: true,
      isPublish: true,
      vendor: {
        zoneId: user.zoneId,
        isActive: true,
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        extras: true,
        itemAttributes: true,
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const response = products.map((p) =>
      this.mapProductResponse(p as ProductWithRelations),
    );
    // Cache for 5 minutes
    await this.redisService.set(cacheKey, response, 300);
    return response;
  }

  async count(query: { vendorId?: string }) {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };
    if (query.vendorId) where.vendorId = query.vendorId;
    return this.prisma.product.count({ where });
  }

  async findOne(id: string) {
    const cacheKey = this.CACHE_KEYS.PRODUCT_BY_ID(id);
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { vendor: true, extras: true, itemAttributes: true },
    });
    if (!product || !product.isActive || !product.vendor?.isActive) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }
    const response = this.mapProductResponse(product);

    // Cache for 10 minutes
    await this.redisService.set(cacheKey, response, 600);
    return response;
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || !product.isActive) {
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

    // Check for duplicate product name within the same vendor (excluding current product)
    if (updateProductDto.name) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          vendorId: vendor.id,
          name: updateProductDto.name,
          isActive: true,
          id: { not: id },
        },
      });
      if (existingProduct) {
        throw new BadRequestException('PRODUCT_NAME_ALREADY_EXISTS');
      }
    }

    const { extras, itemAttributes, ...updateData } = updateProductDto;

    const attributeData = this.parseItemAttributes(itemAttributes);

    const savedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        isActive: undefined, // Ensure isActive is never updated from DTO
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
      include: { extras: true, itemAttributes: true, vendor: true },
    });

    await this.invalidateProductCache(
      id,
      savedProduct.vendorId,
      savedProduct.vendor?.zoneId,
    );
    return this.mapProductResponse(savedProduct);
  }

  async updateRatings(
    productId: string,
    reviewsSum: number,
    reviewsCount: number,
  ) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        reviewsSum,
        reviewsCount,
      },
      include: { vendor: true, extras: true, itemAttributes: true },
    });

    await this.invalidateProductCache(
      productId,
      product.vendorId,
      product.vendor?.zoneId,
    );
    return this.mapProductResponse(product as any);
  }

  async remove(id: string, user: User) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }
    if (!product.isActive) {
      throw new NotFoundException('PRODUCT_ALREADY_DELETED');
    }
    const vendor = await this.vendorsService.findByAuthor(user.id);

    if (!vendor || product.vendorId !== vendor.id) {
      throw new ForbiddenException('FORBIDDEN');
    }

    // Soft delete: set isActive and isPublish to false
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        isActive: false,
        isPublish: false,
      },
      include: { vendor: true },
    });

    await this.invalidateProductCache(
      id,
      updatedProduct.vendorId,
      (updatedProduct as any).vendor?.zoneId,
    );
    return { message: 'Product deleted successfully', product: updatedProduct };
  }

  async search(
    query: string,
    page?: string | number,
    limit?: string | number,
    user?: User,
  ) {
    const p = Number(page) || 1;
    const l = Math.min(Number(limit) || 20, 100);
    const skip = (p - 1) * l;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      name: {
        contains: query,
        mode: 'insensitive',
      },
      vendor: { isActive: true },
    };

    if (user?.role !== UserRole.VENDOR) {
      where.isPublish = true;
    }

    if (user?.role === UserRole.CUSTOMER && user.zoneId) {
      where.vendor = {
        isActive: true,
        zoneId: user.zoneId,
      };
    }

    const products = await this.prisma.product.findMany({
      where,
      include: { extras: true, itemAttributes: true },
      skip,
      take: l,
    });
    return products.map((p) =>
      this.mapProductResponse(p as ProductWithRelations),
    );
  }

  async findOffers(user: User) {
    if (!user.zoneId) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isPublish: true,
        vendor: {
          zoneId: user.zoneId,
          isActive: true,
        },
        discountPrice: { not: null },
      },
      include: {
        extras: true,
        itemAttributes: true,
        vendor: true,
        _count: {
          select: { orderItems: true },
        },
      },
      orderBy: [
        { reviewsCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const offers = products.filter((product) => {
      const price = Number(product.price);
      const discountPrice = Number(product.discountPrice);
      if (price <= 0 || !discountPrice) return false;
      const discountPercentage = ((price - discountPrice) / price) * 100;
      return discountPercentage >= 20;
    });

    // Optionally sort by top sell (order items count)
    const sortedOffers = offers.sort((a, b) =>
      (b as any)._count.orderItems - (a as any)._count.orderItems
    );

    return sortedOffers.map((p) => this.mapProductResponse(p as any));
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
    attrInput?: string | string[],
  ): { key: string; value: string }[] | null {
    if (!attrInput) return null;

    // Handle array of key:value strings
    if (Array.isArray(attrInput)) {
      return attrInput
        .map((item) => {
          const [key, value] = item.split(':');
          return { key: key?.trim(), value: value?.trim() || '' };
        })
        .filter((p) => p.key);
    }

    // Handle single string
    const attrString = attrInput;
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

  async getCategoryViewData(
    categoryId: string,
    user: User,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    if (!user.zoneId) {
      throw new BadRequestException('USER_ZONE_REQUIRED');
    }

    const [products, categories] = await Promise.all([
      this.findByCategoryAndZone(categoryId, user, page, limit, search),
      this.prisma.category.findMany({
        where: {
          isActive: true,
          products: {
            some: {
              isActive: true,
              isPublish: true,
              vendor: {
                zoneId: user.zoneId,
                isActive: true,
              },
            },
          },
        },
        orderBy: { arabicName: 'asc' },
      }),
    ]);

    return {
      products,
      categories,
    };
  }
}
