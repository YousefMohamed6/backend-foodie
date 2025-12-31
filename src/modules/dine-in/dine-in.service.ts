import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDineInBookingDto } from './dto/create-dine-in-booking.dto';

@Injectable()
export class DineInService {
  constructor(private prisma: PrismaService) { }

  async create(createDineInBookingDto: CreateDineInBookingDto) {
    return this.prisma.dineInBooking.create({
      data: createDineInBookingDto,
    });
  }

  async findAll(userId?: string, query: { isUpcoming?: string | boolean } = {}) {
    const where: Prisma.DineInBookingWhereInput = {};

    if (userId) {
      where.authorId = userId;
    }

    // Filter by upcoming vs past bookings
    if (query.isUpcoming !== undefined) {
      const now = new Date();
      if (query.isUpcoming === 'true' || query.isUpcoming === true) {
        where.date = { gte: now };
      } else {
        where.date = { lt: now };
      }
    }

    return this.prisma.dineInBooking.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }
}
