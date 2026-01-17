import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavouritesService {
  constructor(private prisma: PrismaService) {}

  async getFavoriteVendors(userId: string) {
    return this.prisma.favoriteVendor.findMany({
      where: { userId },
      include: { vendor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavoriteVendor(userId: string, vendorId: string) {
    const existing = await this.prisma.favoriteVendor.findUnique({
      where: {
        userId_vendorId: {
          userId,
          vendorId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('ALREADY_FAVORITED');
    }
    return this.prisma.favoriteVendor.create({
      data: { userId, vendorId },
    });
  }

  async removeFavoriteVendor(userId: string, vendorId: string) {
    try {
      await this.prisma.favoriteVendor.delete({
        where: {
          userId_vendorId: {
            userId,
            vendorId,
          },
        },
      });
      return { message: 'Removed from favorites' };
    } catch (error) {
      throw new NotFoundException('NOT_IN_FAVORITES');
    }
  }

  async getFavoriteProducts(userId: string) {
    return this.prisma.favoriteProduct.findMany({
      where: {
        userId,
        product: {
          isActive: true,
          vendor: { isActive: true },
        },
      },
      include: {
        product: {
          include: { vendor: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavoriteProduct(userId: string, productId: string) {
    const existing = await this.prisma.favoriteProduct.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('ALREADY_FAVORITED');
    }
    return this.prisma.favoriteProduct.create({
      data: { userId, productId },
    });
  }

  async removeFavoriteProduct(userId: string, productId: string) {
    try {
      await this.prisma.favoriteProduct.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      return { message: 'Removed from favorites' };
    } catch (error) {
      throw new NotFoundException('NOT_IN_FAVORITES');
    }
  }
}
