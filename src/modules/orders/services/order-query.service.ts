import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReviewsService } from '../../reviews/reviews.service';
import { OrderManagementService } from '../order-management.service';
import { ORDERS_ERRORS } from '../orders.constants';
import { mapOrderResponse, orderInclude } from '../orders.helper';

@Injectable()
export class OrderQueryService {
    constructor(
        private prisma: PrismaService,
        private managementService: OrderManagementService,
        private reviewsService: ReviewsService,
    ) { }

    async findAll(
        user: Pick<User, 'id' | 'role'>,
        query: {
            vendorId?: string;
            status?: OrderStatus | string;
            firstOrder?: string;
            page?: string | number;
            limit?: string | number;
        },
    ) {
        if (user.role === UserRole.CUSTOMER && query.firstOrder === 'true') {
            const orderCount = await this.prisma.order.count({
                where: { authorId: user.id },
            });
            return { isFirstOrder: orderCount === 0 };
        }

        const where = await this.buildSearchFilters(user, query);
        if (!where) return [];

        const page = Number(query.page) || 1;
        const limit = Math.min(Number(query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        const orders = await this.prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: orderInclude,
            skip,
            take: limit,
        });

        return orders.map((order) => mapOrderResponse(order));
    }

    async count(where: Prisma.OrderWhereInput) {
        return this.prisma.order.count({ where });
    }

    async aggregate(args: Prisma.OrderAggregateArgs) {
        return this.prisma.order.aggregate(args);
    }

    async findOne(id: string, user: User) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: orderInclude,
        });

        if (!order) {
            throw new NotFoundException(ORDERS_ERRORS.ORDER_NOT_FOUND);
        }

        if (user.role === UserRole.CUSTOMER && order.authorId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        if (user.role === UserRole.VENDOR && order.vendor?.authorId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        if (user.role === UserRole.DRIVER && order.driverId !== user.id) {
            throw new ForbiddenException(ORDERS_ERRORS.ACCESS_DENIED);
        }

        if (user.role === UserRole.MANAGER) {
            await this.managementService.validateManagerZoneAccess(
                user.id,
                order.vendor.zoneId,
            );
        }

        return mapOrderResponse(order);
    }

    async getOrderReview(orderId: string, productId: string) {
        return this.reviewsService.findByOrderAndProduct(orderId, productId);
    }

    async buildSearchFilters(
        user: Pick<User, 'id' | 'role'>,
        query: { vendorId?: string; status?: OrderStatus | string },
    ) {
        const where: Prisma.OrderWhereInput = {};

        if (user.role === UserRole.CUSTOMER) {
            where.authorId = user.id;
        } else if (user.role === UserRole.VENDOR) {
            where.vendor = { authorId: user.id };
            if (query.vendorId) where.vendorId = query.vendorId;
        } else if (user.role === UserRole.DRIVER) {
            where.driverId = user.id;
        } else if (user.role === UserRole.MANAGER) {
            const zoneId = await this.managementService
                .getManagerZoneId(user.id)
                .catch(() => null);
            if (!zoneId) return null;
            where.vendor = { zoneId };
        }

        if (query.status) {
            const statusMap: Record<string, OrderStatus> = {
                'PLACED': OrderStatus.PLACED,
                'VENDOR_ACCEPTED': OrderStatus.VENDOR_ACCEPTED,
                'VENDOR_REJECTED': OrderStatus.VENDOR_REJECTED,
                'DRIVER_PENDING': OrderStatus.DRIVER_PENDING,
                'DRIVER_ACCEPTED': OrderStatus.DRIVER_ACCEPTED,
                'DRIVER_REJECTED': OrderStatus.DRIVER_REJECTED,
                'SHIPPED': OrderStatus.SHIPPED,
                'IN_TRANSIT': OrderStatus.IN_TRANSIT,
                'COMPLETED': OrderStatus.COMPLETED,
                'CANCELLED': OrderStatus.CANCELLED,
            };

            const statusArray = typeof query.status === 'string'
                ? query.status.split(',').map((s) => s.trim())
                : [query.status];

            const mappedStatuses = statusArray
                .map((s) => statusMap[s] || (Object.values(OrderStatus).includes(s as OrderStatus) ? s as OrderStatus : null))
                .filter((s): s is OrderStatus => s !== null);

            if (mappedStatuses.length > 1) {
                where.status = { in: mappedStatuses };
            } else if (mappedStatuses.length === 1) {
                where.status = mappedStatuses[0];
            }
        }
        return where;
    }
}
