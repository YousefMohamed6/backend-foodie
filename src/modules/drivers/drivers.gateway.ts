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
import { UsersService } from '../users/users.service';
import { DriversService } from './drivers.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'drivers',
})
export class DriversGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private driversService: DriversService,
    private usersService: UsersService,
  ) { }

  handleConnection(client: Socket) {
    const driverId = client.handshake.query.driverId as string;
    if (driverId) {
      client.join(`driver_${driverId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const driverId = client.handshake.query.driverId as string;
    if (driverId) {
      client.leave(`driver_${driverId}`);
    }
  }

  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @MessageBody()
    data: {
      driverId: string;
      latitude: number;
      longitude: number;
      rotation?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Update location in database
      await this.usersService.updateLocation(data.driverId, {
        latitude: data.latitude,
        longitude: data.longitude,
        rotation: data.rotation,
      });

      // Broadcast to anyone watching this driver
      this.server
        .to(`driver_${data.driverId}`)
        .emit('driverLocationUpdated', {
          driverId: data.driverId,
          latitude: data.latitude,
          longitude: data.longitude,
          rotation: data.rotation,
          timestamp: new Date(),
        });

      return { event: 'location_updated', success: true };
    } catch (error) {
      return { event: 'location_update_failed', error: (error as Error).message };
    }
  }

  @SubscribeMessage('watchDriverLocation')
  handleWatchDriverLocation(
    @MessageBody('driverId') driverId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`driver_${driverId}`);
    return { event: 'watching_driver', driverId };
  }

  @SubscribeMessage('stopWatchDriverLocation')
  handleStopWatchDriverLocation(
    @MessageBody('driverId') driverId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`driver_${driverId}`);
    return { event: 'stopped_watching_driver', driverId };
  }

  // Method to emit driver location updates (called from service)
  emitDriverLocationUpdate(driverId: string, location: { latitude: number; longitude: number; rotation?: number }) {
    this.server
      .to(`driver_${driverId}`)
      .emit('driverLocationUpdated', {
        driverId,
        ...location,
        timestamp: new Date(),
      });
  }
}
