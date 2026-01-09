import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ManagerAuditService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.managerAuditLog.findMany({
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
