import {
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: { images: true; ratings: true; customer: true };
}>;

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) { }

  async create(createReviewDto: CreateReviewDto, user: User) {
    const { images, reviewAttributes, ...rest } = createReviewDto;

    // Normalize reviewAttributes
    let ratingsData: { attributeId: string; rating: number }[] = [];
    if (reviewAttributes) {
      if (Array.isArray(reviewAttributes)) {
        ratingsData = reviewAttributes.map(r => ({ attributeId: r.id || r.attributeId, rating: Number(r.rating) }));
      } else if (typeof reviewAttributes === 'object') {
        ratingsData = Object.entries(reviewAttributes).map(([id, rating]) => ({ attributeId: id, rating: Number(rating) }));
      }
    }

    const savedReview = await this.prisma.review.create({
      data: {
        ...rest,
        customerId: user.id,
        images: images
          ? {
            create: images.map((url) => ({ url })),
          }
          : undefined,
        ratings: ratingsData.length > 0 ? {
          create: ratingsData,
        } : undefined,
      },
      include: { images: true, ratings: true, customer: true },
    });

    return this.mapReviewResponse(savedReview);
  }

  async findAll(query: { vendorId?: string; productId?: string }) {
    const where: Prisma.ReviewWhereInput = {};
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.productId) where.productId = query.productId;

    const reviews = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { images: true, ratings: true, customer: true },
    });

    return reviews.map((review) => this.mapReviewResponse(review));
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { images: true, ratings: true, customer: true },
    });
    if (!review) {
      throw new NotFoundException();
    }
    return this.mapReviewResponse(review)!;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, user: User) {
    const review = await this.findOne(id);
    if (review.customerId !== user.id) {
      throw new NotFoundException();
    }

    const { images, reviewAttributes, ...rest } = updateReviewDto;

    // Normalize reviewAttributes
    let ratingsData: { attributeId: string; rating: number }[] = [];
    if (reviewAttributes) {
      if (Array.isArray(reviewAttributes)) {
        ratingsData = reviewAttributes.map(r => ({ attributeId: r.id || r.attributeId, rating: Number(r.rating) }));
      } else if (typeof reviewAttributes === 'object') {
        ratingsData = Object.entries(reviewAttributes).map(([id, rating]) => ({ attributeId: id, rating: Number(rating) }));
      }
    }

    const savedReview = await this.prisma.review.update({
      where: { id },
      data: {
        ...rest,
        images: images
          ? {
            deleteMany: {},
            create: images.map((url) => ({ url })),
          }
          : undefined,
        ratings: reviewAttributes ? {
          deleteMany: {},
          create: ratingsData,
        } : undefined,
      },
      include: { images: true, ratings: true, customer: true },
    });

    return this.mapReviewResponse(savedReview);
  }

  async remove(id: string, user: User) {
    const review = await this.findOne(id);
    if (review.customerId !== user.id) {
      throw new NotFoundException();
    }
    return this.prisma.review.delete({ where: { id } });
  }

  async averageRatingForVendor(vendorId: string) {
    const aggregations = await this.prisma.review.aggregate({
      _avg: {
        rating: true,
      },
      where: {
        vendorId,
      },
    });
    return aggregations._avg.rating || 0;
  }

  async findByOrderAndProduct(orderId: string, productId: string) {
    const review = await this.prisma.review.findFirst({
      where: { orderId, productId },
      include: { images: true, ratings: true, customer: true },
    });
    if (!review) {
      throw new NotFoundException(
        'Review not found for this product in this order',
      );
    }
    return this.mapReviewResponse(review);
  }

  async getVendorReviewAttributes(vendorId: string) {
    // In a real app, this might come from a DB or vendor settings
    // Mocking based on common attributes
    return {
      attributes: [
        { id: 'cleanliness', name: 'Cleanliness' },
        { id: 'food_quality', name: 'Food Quality' },
        { id: 'delivery_speed', name: 'Delivery Speed' },
        { id: 'packaging', name: 'Packaging' },
      ],
    };
  }

  private mapReviewResponse(review: ReviewWithRelations | null) {
    if (!review) return null;
    const { images, ratings, customer, ...rest } = review;

    // Map ratings back to object { [attributeId]: rating }
    const reviewAttributes = ratings?.reduce((acc, r) => {
      acc[r.attributeId] = r.rating;
      return acc;
    }, {} as Record<string, number>) || {};

    // Map relational images back to simple string array to preserve response shape
    return {
      ...rest,
      uname: customer?.firstName ? `${customer.firstName} ${customer.lastName}` : 'Anonymous',
      profile: customer?.profilePictureURL || null,
      images: images?.map((img) => img.url) || [],
      reviewAttributes,
    };
  }
}
