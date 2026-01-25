import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UserRole } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderSocketEvents } from './orders.constants';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'orders',
})
@UseGuards(WsJwtGuard)
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;

      // 1. Join private user room (for customer notifications and driver direct updates)
      client.join(payload.sub);

      // 2. Fetch specific room data based on role
      const dbUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { vendorId: true, zoneId: true, role: true },
      });

      if (dbUser) {
        // Auto-join Vendor Room
        if (dbUser.vendorId && dbUser.role === UserRole.VENDOR) {
          const vendorRoom = `${OrderSocketEvents.VENDOR_ROOM_PREFIX}${dbUser.vendorId}`;
          client.join(vendorRoom);
          this.logger.log(`Client ${payload.sub} joined vendor room: ${vendorRoom}`);
        }

        // Auto-join Zone Room
        if (dbUser.zoneId && dbUser.role === UserRole.MANAGER) {
          const zoneRoom = `${OrderSocketEvents.ZONE_ROOM_PREFIX}${dbUser.zoneId}`;
          client.join(zoneRoom);
          this.logger.log(`Client ${payload.sub} joined zone room: ${zoneRoom}`);
        }
      }

      this.logger.log(`Client authenticated: ${payload.sub}`);
    } catch (err) {
      this.logger.error(`WS Connection failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client disconnected: ${user.sub}`);
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader =
      client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (authHeader) {
      return authHeader.split(' ')[1] || authHeader;
    }
    const queryToken = client.handshake.query?.token;
    return Array.isArray(queryToken) ? queryToken[0] : (queryToken as string);
  }

  @SubscribeMessage('watchOrder')
  handleWatchOrder(
    @MessageBody('orderId') orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(orderId);
    return { event: 'watching', orderId };
  }

  @SubscribeMessage('stopWatchOrder')
  handleStopWatchOrder(
    @MessageBody('orderId') orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(orderId);
    return { event: 'stopped_watching', orderId };
  }

  @SubscribeMessage('watchVendorOrders')
  async handleWatchVendorOrders(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user?.sub) {
      return { error: 'UNAUTHORIZED' };
    }

    // Get vendor's vendorId from database
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { vendorId: true, role: true },
    });

    if (!dbUser?.vendorId) {
      return { error: 'NO_VENDOR_ASSIGNED' };
    }

    // Only vendors can watch vendor orders
    if (dbUser.role !== UserRole.VENDOR) {
      return { error: 'FORBIDDEN' };
    }

    const vendorRoom = `${OrderSocketEvents.VENDOR_ROOM_PREFIX}${dbUser.vendorId}`;
    client.join(vendorRoom);
    this.logger.log(
      `Vendor ${user.sub} watching vendor orders: ${dbUser.vendorId}`,
    );
    return { event: 'watching_vendor', vendorId: dbUser.vendorId };
  }

  @SubscribeMessage('stopWatchVendorOrders')
  async handleStopWatchVendorOrders(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user?.sub) {
      return { error: 'UNAUTHORIZED' };
    }

    // Get vendor's vendorId from database
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { vendorId: true },
    });

    if (dbUser?.vendorId) {
      const vendorRoom = `${OrderSocketEvents.VENDOR_ROOM_PREFIX}${dbUser.vendorId}`;
      client.leave(vendorRoom);
      this.logger.log(
        `Vendor ${user.sub} stopped watching vendor orders: ${dbUser.vendorId}`,
      );
    }

    return { event: 'stopped_watching_vendor' };
  }

  @SubscribeMessage('watchZoneOrders')
  async handleWatchZoneOrders(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user?.sub) {
      return { error: 'UNAUTHORIZED' };
    }

    // Get user's zone ID from database
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { zoneId: true, role: true },
    });

    if (!dbUser?.zoneId) {
      return { error: 'NO_ZONE_ASSIGNED' };
    }

    // Only managers can watch zone orders
    if (dbUser.role !== UserRole.MANAGER) {
      return { error: 'FORBIDDEN' };
    }

    const zoneRoom = `${OrderSocketEvents.ZONE_ROOM_PREFIX}${dbUser.zoneId}`;
    client.join(zoneRoom);
    this.logger.log(
      `Manager ${user.sub} watching zone orders: ${dbUser.zoneId}`,
    );
    return { event: 'watching_zone', zoneId: dbUser.zoneId };
  }

  @SubscribeMessage('stopWatchZoneOrders')
  async handleStopWatchZoneOrders(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user?.sub) {
      return { error: 'UNAUTHORIZED' };
    }

    // Get user's zone ID from database
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { zoneId: true },
    });

    if (dbUser?.zoneId) {
      const zoneRoom = `${OrderSocketEvents.ZONE_ROOM_PREFIX}${dbUser.zoneId}`;
      client.leave(zoneRoom);
      this.logger.log(
        `Manager ${user.sub} stopped watching zone orders: ${dbUser.zoneId}`,
      );
    }

    return { event: 'stopped_watching_zone' };
  }

  @SubscribeMessage('updateDriverLocation')
  async handleUpdateDriverLocation(
    @MessageBody()
    data: {
      orderId: string;
      latitude: number;
      longitude: number;
      rotation?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user || user.role !== UserRole.DRIVER) {
      return { error: 'UNAUTHORIZED' };
    }

    // 1. Verify driver is assigned to this order
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      select: { driverId: true, vendorId: true },
    });

    if (!order || order.driverId !== user.sub) {
      return { error: 'NOT_ASSIGNED_TO_ORDER' };
    }

    // 2. Broadcast to all interested parties (Vendor, Customer, Order room)
    this.emitDriverLocationToOrder(
      data.orderId,
      user.sub,
      order.vendorId,
      data,
    );

    return { success: true };
  }

  emitOrderUpdate(
    order: any,
    zoneId?: string,
  ) {
    this.logger.log(`Emitting order update: ${order.id}, Status: ${order.status}, Vendor: ${order.vendorId}`);

    // Emit to order room
    this.server.to(order.id).emit(OrderSocketEvents.ORDER_UPDATED, order);

    // Emit to vendor room (vendor uses vendorId)
    if (order.vendorId) {
      const vendorRoom = `${OrderSocketEvents.VENDOR_ROOM_PREFIX}${order.vendorId}`;
      this.server.to(vendorRoom).emit(OrderSocketEvents.VENDOR_ORDER_UPDATED, order);
      this.logger.debug(`Sent to vendor room: ${vendorRoom}`);
    }

    // Emit to customer room (customer uses authorId - their own orders)
    if (order.authorId) {
      this.server
        .to(order.authorId)
        .emit(OrderSocketEvents.CUSTOMER_ORDER_UPDATED, order);
      this.logger.debug(`Sent to customer room: ${order.authorId}`);
    }

    // Emit to driver room if assigned (driver uses driverId - their assigned orders)
    if (order.driverId) {
      this.server
        .to(order.driverId)
        .emit(OrderSocketEvents.DRIVER_ORDER_UPDATED, order);
      this.logger.debug(`Sent to driver room: ${order.driverId}`);
    }

    // Emit to zone room if zoneId is provided (manager uses zoneId)
    if (zoneId) {
      const zoneRoom = `${OrderSocketEvents.ZONE_ROOM_PREFIX}${zoneId}`;
      this.server.to(zoneRoom).emit(OrderSocketEvents.ZONE_ORDER_UPDATED, order);
      this.logger.debug(`Sent to zone room: ${zoneRoom}`);
    }
  }

  emitDriverLocationToOrder(
    orderId: string,
    driverId: string,
    vendorId: string,
    location: { latitude: number; longitude: number; rotation?: number },
  ) {
    const payload = {
      orderId,
      driverId,
      ...location,
      timestamp: new Date(),
    };

    // Emit to order room (customer/driver watching specific order)
    this.server.to(orderId).emit(OrderSocketEvents.DRIVER_LOCATION_UPDATED, payload);

    // Emit to vendor room (vendor dashboard tracking)
    this.server
      .to(`${OrderSocketEvents.VENDOR_ROOM_PREFIX}${vendorId}`)
      .emit(OrderSocketEvents.DRIVER_LOCATION_UPDATED, payload);
  }
}
