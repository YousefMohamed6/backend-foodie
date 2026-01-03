import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'settings',
})
export class SettingsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    client.join('global_settings');
  }

  handleDisconnect(client: Socket) {}

  emitSettingsUpdate(settings: Record<string, any>) {
    this.server.to('global_settings').emit('settingsUpdated', settings);
  }
}
