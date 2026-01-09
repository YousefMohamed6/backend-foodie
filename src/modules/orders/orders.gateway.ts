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
import { Order } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'orders',
})
@UseGuards(WsJwtGuard)
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OrdersGateway.name);

  constructor(private readonly jwtService: JwtService) {}

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

      // Join private user room safely
      client.join(payload.sub);
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
  handleWatchVendorOrders(
    @MessageBody('vendorId') vendorId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`vendor_${vendorId}`);
    return { event: 'watching_vendor', vendorId };
  }

  emitOrderUpdate(
    order: Pick<Order, 'id' | 'vendorId' | 'authorId' | 'driverId'> &
      Record<string, any>,
  ) {
    // Emit to order room
    this.server.to(order.id).emit('orderUpdated', order);
    // Emit to vendor room
    this.server
      .to(`vendor_${order.vendorId}`)
      .emit('vendorOrderUpdated', order);
    // Emit to customer room
    this.server.to(order.authorId).emit('customerOrderUpdated', order);
    // Emit to driver room if assigned
    if (order.driverId) {
      this.server.to(order.driverId).emit('driverOrderUpdated', order);
    }
  }

  emitDriverLocationToOrder(
    orderId: string,
    driverId: string,
    location: { latitude: number; longitude: number; rotation?: number },
  ) {
    this.server.to(orderId).emit('orderDriverLocationUpdated', {
      orderId,
      driverId,
      ...location,
      timestamp: new Date(),
    });
  }
}
