import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Order } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'orders',
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(userId);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.leave(userId);
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
  handleWatchVendorOrders(
    @MessageBody('vendorId') vendorId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`vendor_${vendorId}`);
    return { event: 'watching_vendor', vendorId };
  }

  emitOrderUpdate(order: Pick<Order, 'id' | 'vendorId' | 'authorId' | 'driverId'> & Record<string, any>) {
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
}
