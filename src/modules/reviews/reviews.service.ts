import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { images, ...rest } = createReviewDto;

    const savedReview = await this.prisma.review.create({
      data: {
        ...rest,
        customerId: user.id,
        images: images
          ? {
            create: images.map((url) => ({ url })),
          }
          : undefined,
      },
      include: { images: true, ratings: true, customer: true },
    });

    // Update Vendor's reviewsSum and reviewsCount
    await this.prisma.vendor.update({
      where: { id: rest.vendorId },
      data: {
        reviewsSum: { increment: rest.rating },
        reviewsCount: { increment: 1 },
      },
    });

    return this.mapReviewResponse(savedReview); // ratings: true is still in include, but no data created for it, which is fine for now as table structure might still exist or be empty
  }

  async findAll(query: {
    vendorId?: string;
    productId?: string;
    page?: string | number;
    limit?: string | number;
  }) {
    const where: Prisma.ReviewWhereInput = {};
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.productId) where.productId = query.productId;

    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const reviews = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { images: true, ratings: true, customer: true },
      skip,
      take: limit,
    });

    return reviews.map((review) => this.mapReviewResponse(review));
  }

  async count(where: Prisma.ReviewWhereInput) {
    return this.prisma.review.count({ where });
  }

  async aggregate(args: Prisma.ReviewAggregateArgs) {
    return this.prisma.review.aggregate(args);
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { images: true, ratings: true, customer: true },
    });
    if (!review) {
      throw new NotFoundException('REVIEW_NOT_FOUND');
    }
    return this.mapReviewResponse(review)!;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, user: User) {
    const oldReview = await this.prisma.review.findUnique({ where: { id } });
    if (!oldReview || oldReview.customerId !== user.id) {
      throw new NotFoundException('REVIEW_NOT_FOUND');
    }

    const { images, ...rest } = updateReviewDto;
    const oldRating = oldReview.rating;
    const newRating = rest.rating !== undefined ? rest.rating : oldRating;
    const ratingDelta = newRating - oldRating;

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
      },
      include: { images: true, ratings: true, customer: true },
    });

    if (ratingDelta !== 0) {
      await this.prisma.vendor.update({
        where: { id: oldReview.vendorId },
        data: {
          reviewsSum: { increment: ratingDelta },
        },
      });
    }

    return this.mapReviewResponse(savedReview);
  }

  async remove(id: string, user: User) {
    const review = await this.findOne(id);
    if (review.customerId !== user.id) {
      throw new NotFoundException('REVIEW_NOT_FOUND');
    }

    // Update Vendor's reviewsSum and reviewsCount
    await this.prisma.vendor.update({
      where: { id: review.vendorId },
      data: {
        reviewsSum: { decrement: review.rating },
        reviewsCount: { decrement: 1 },
      },
    });

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
      throw new NotFoundException('REVIEW_NOT_FOUND_FOR_PRODUCT_IN_ORDER');
    }
    return this.mapReviewResponse(review);
  }

  private mapReviewResponse(review: ReviewWithRelations | null) {
    if (!review) return null;
    const { images, ratings, customer, ...rest } = review;

    return {
      ...rest,
      uname: customer?.firstName
        ? `${customer.firstName} ${customer.lastName}`
        : 'Anonymous',
      profile: customer?.profilePictureURL || null,
      images: images?.map((img) => img.url) || [],
      reviewAttributes: {},
    };
  }
}
