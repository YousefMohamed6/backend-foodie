import { NotFoundException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';

// Explicitly typing this to bypass potential type inference issues with generated client
export const orderInclude = {
  author: true,
  vendor: true,
  driver: true,
  address: true,
  items: {
    include: {
      extras: true,
      product: true,
    },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

/**
 * Calculate distance between two points in km using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Number(d.toFixed(2));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate subtotal from product prices and extras
 */
export function calculateSubtotal(
  items: CreateOrderDto['products'],
  productMap: Map<string, Product>,
): number {
  let subtotal = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    const price = product.discountPrice
      ? Number(product.discountPrice)
      : Number(product.price);
    let itemTotal = price * item.quantity;

    if (item.extras) {
      for (const extra of item.extras) {
        itemTotal += Number(extra.price) * item.quantity;
      }
    }

    subtotal += itemTotal;
  }

  return subtotal;
}

/**
 * Map Prisma order relation to historical API structure
 */
export function mapOrderResponse(order: OrderWithRelations | null) {
  if (!order) return null;
  const { items, ...rest } = order;
  return {
    ...rest,
    products: items || [],
  };
}
