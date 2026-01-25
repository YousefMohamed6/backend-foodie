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
import { mapOrderResponse } from './orders.helper';

// Type for mapped order response (what gets sent over socket)
type OrderSocketResponse = ReturnType<typeof mapOrderResponse>;

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  namespace: 'orders',
  transports: ['websocket', 'polling'], // Support both transports
})
@UseGuards(WsJwtGuard)
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  @WebSocketServer()
  server: Server;

  /**
   * Handle new client connection
   * Manual authentication check since Guards don't protect handleConnection
   */
  async handleConnection(client: Socket) {
    try {
      let user = client.data.user;

      // If user not set by guard (which is expected for handleConnection), try manual verification
      if (!user) {
        const token = this.extractToken(client);
        if (token) {
          try {
            user = await this.jwtService.verifyAsync(token);
            client.data.user = user;
          } catch (e) {
            this.logger.warn(`Token verification failed: ${e.message}`);
          }
        }
      }

      if (!user?.sub) {
        this.logger.warn('Connection attempt without valid user data');
        client.disconnect();
        return;
      }

      // 1. Join private user room (for customer notifications and driver direct updates)
      client.join(user.sub);
      this.logger.debug(`Client ${user.sub} joined user room: ${user.sub}`);

      // 2. Fetch specific room data based on role
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { vendorId: true, zoneId: true, role: true },
      });

      if (!dbUser) {
        this.logger.warn(`User ${user.sub} not found in database`);
        client.disconnect();
        return;
      }

      // Auto-join Vendor Room
      if (dbUser.vendorId && dbUser.role === UserRole.VENDOR) {
        const vendorRoom = `${OrderSocketEvents.VENDOR_ROOM_PREFIX}${dbUser.vendorId}`;
        client.join(vendorRoom);
        this.logger.log(`Vendor ${user.sub} auto-joined vendor room: ${vendorRoom}`);
      }

      // Auto-join Zone Room
      if (dbUser.zoneId && dbUser.role === UserRole.MANAGER) {
        const zoneRoom = `${OrderSocketEvents.ZONE_ROOM_PREFIX}${dbUser.zoneId}`;
        client.join(zoneRoom);
        this.logger.log(`Manager ${user.sub} auto-joined zone room: ${zoneRoom}`);
      }

      this.logger.log(`Client connected: ${user.sub} (${dbUser.role})`);
    } catch (err) {
      this.logger.error(`WS Connection failed: ${err.message}`, err.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client disconnected: ${user.sub}`);
    } else {
      this.logger.debug('Client disconnected (unauthenticated)');
    }
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
      this.logger.warn('watchVendorOrders called without authentication');
      return { error: 'UNAUTHORIZED' };
    }

    try {
      // Get vendor's vendorId from database
      // Check both:
      // 1. vendorId (if user is staff)
      // 2. vendorAuthorOf (if user is the owner)
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: {
          vendorId: true,
          role: true,
          vendorAuthorOf: {
            select: { id: true },
          },
        },
      });

      const vendorId = dbUser?.vendorId || dbUser?.vendorAuthorOf?.id;

      if (!vendorId) {
        this.logger.warn(
          `User ${user.sub} attempted to watch vendor orders but has no vendorId`,
        );
        return { error: 'NO_VENDOR_ASSIGNED' };
      }

      // Only vendors can watch vendor orders
      if (dbUser.role !== UserRole.VENDOR) {
        this.logger.warn(`User ${user.sub} (${dbUser.role}) attempted to watch vendor orders`);
        return { error: 'FORBIDDEN' };
      }

      const vendorRoom = `${OrderSocketEvents.VENDOR_ROOM_PREFIX}${vendorId}`;
      client.join(vendorRoom);
      this.logger.log(
        `Vendor ${user.sub} watching vendor orders: ${vendorId}`,
      );
      return { event: 'watching_vendor', vendorId: vendorId };
    } catch (error) {
      this.logger.error(`Error in watchVendorOrders: ${error.message}`, error.stack);
      return { error: 'INTERNAL_ERROR' };
    }
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
      this.logger.warn(`Non-driver ${user?.sub} attempted to update driver location`);
      return { error: 'UNAUTHORIZED' };
    }

    // Validate input
    if (!data.orderId || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
      this.logger.warn(`Invalid driver location data from ${user.sub}`);
      return { error: 'INVALID_DATA' };
    }

    try {
      // 1. Verify driver is assigned to this order
      const order = await this.prisma.order.findUnique({
        where: { id: data.orderId },
        select: { driverId: true, vendorId: true },
      });

      if (!order) {
        this.logger.warn(`Driver ${user.sub} attempted to update location for non-existent order: ${data.orderId}`);
        return { error: 'ORDER_NOT_FOUND' };
      }

      if (order.driverId !== user.sub) {
        this.logger.warn(`Driver ${user.sub} attempted to update location for order ${data.orderId} assigned to ${order.driverId}`);
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
    } catch (error) {
      this.logger.error(`Error updating driver location: ${error.message}`, error.stack);
      return { error: 'INTERNAL_ERROR' };
    }
  }

  /**
   * Emit order update to all relevant rooms
   * @param order - Mapped order response (from mapOrderResponse)
   * @param zoneId - Optional zone ID for manager notifications
   */
  emitOrderUpdate(order: OrderSocketResponse, zoneId?: string) {
    if (!order || !order.id) {
      this.logger.warn('Attempted to emit order update with invalid order data');
      return;
    }

    this.logger.log(
      `Emitting order update: ${order.id}, Status: ${order.status}, Vendor: ${order.vendorId}`,
    );

    try {
      // Emit to order room (for specific order watchers)
      if (order.id) {
        this.server.to(order.id).emit(OrderSocketEvents.ORDER_UPDATED, order);
      }

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
    } catch (error) {
      this.logger.error(`Error emitting order update: ${error.message}`, error.stack);
    }
  }

  /**
   * Emit driver location update to relevant rooms
   */
  emitDriverLocationToOrder(
    orderId: string,
    driverId: string,
    vendorId: string,
    location: { latitude: number; longitude: number; rotation?: number },
  ) {
    if (!orderId || !driverId || !vendorId) {
      this.logger.warn('Invalid parameters for emitDriverLocationToOrder');
      return;
    }

    // Validate coordinates
    if (
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number' ||
      isNaN(location.latitude) ||
      isNaN(location.longitude)
    ) {
      this.logger.warn('Invalid coordinates in driver location update');
      return;
    }

    const payload = {
      orderId,
      driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      rotation: location.rotation,
      timestamp: new Date().toISOString(),
    };

    try {
      // Emit to order room (customer/driver watching specific order)
      this.server.to(orderId).emit(OrderSocketEvents.DRIVER_LOCATION_UPDATED, payload);

      // Emit to vendor room (vendor dashboard tracking)
      const vendorRoom = `${OrderSocketEvents.VENDOR_ROOM_PREFIX}${vendorId}`;
      this.server.to(vendorRoom).emit(OrderSocketEvents.DRIVER_LOCATION_UPDATED, payload);

      this.logger.debug(`Driver location updated for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Error emitting driver location: ${error.message}`, error.stack);
    }
  }

  private extractToken(client: Socket): string | null {
    // Try handshake auth first
    const authHeader =
      client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (authHeader) {
      return authHeader.split(' ')[1] || authHeader;
    }

    // Try query parameter as fallback
    const queryToken = client.handshake.query?.token;
    if (queryToken) {
      return Array.isArray(queryToken) ? queryToken[0] : queryToken;
    }

    return null;
  }
}
