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
import { VendorsService } from './vendors.service';
import { Vendor } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'vendors',
})
export class VendorsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly vendorsService: VendorsService) {}

  handleConnection(client: Socket) {}

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('requestNearbyVendors')
  async handleRequestNearbyVendors(
    @MessageBody()
    data: {
      latitude: number;
      longitude: number;
      radius?: number;
      categoryId?: string;
      isDining?: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // This is a one-time request over socket, but could be polled or pushed
    const vendors = await this.vendorsService.findNearest(
      data.latitude,
      data.longitude,
      data.radius || 10,
      data.isDining,
      data.categoryId,
    );
    return { event: 'nearby_vendors', vendors };
  }

  @SubscribeMessage('watchNearestVendors')
  handleWatchNearestVendors(
    @MessageBody()
    data: {
      latitude: number;
      longitude: number;
      radius?: number;
      categoryId?: string;
      isDining?: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Join room for real-time vendor updates
    client.join(`vendors_${data.latitude}_${data.longitude}`);
    return { event: 'watching_vendors', data };
  }

  @SubscribeMessage('stopWatchNearestVendors')
  handleStopWatchNearestVendors(
    @MessageBody()
    data: {
      latitude: number;
      longitude: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`vendors_${data.latitude}_${data.longitude}`);
    return { event: 'stopped_watching_vendors' };
  }

  // Method to emit vendor updates to all watching clients
  emitVendorUpdate(vendor: Partial<Vendor> & { id: string }) {
    // Emit to all clients watching vendors in that area
    this.server.emit('vendorUpdated', vendor);
  }
}
