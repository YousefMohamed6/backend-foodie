import { Logger } from '@nestjs/common';
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
import { SupportConstants } from './support.constants';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'support',
})
export class SupportGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportGateway.name);

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const role = client.handshake.query.role as string;

    if (role === 'ADMIN') {
      // Admin joins the admin room
      client.join(SupportConstants.SOCKET_ROOMS.ADMIN);
      this.logger.log(`Admin connected to support: ${userId}`);
    } else if (userId) {
      // User joins their personal room
      client.join(`${SupportConstants.SOCKET_ROOMS.USER_PREFIX}${userId}`);
      this.logger.log(`User ${userId} connected to support`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const role = client.handshake.query.role as string;

    if (role === 'ADMIN') {
      client.leave(SupportConstants.SOCKET_ROOMS.ADMIN);
      this.logger.log(`Admin disconnected from support: ${userId}`);
    } else if (userId) {
      client.leave(`${SupportConstants.SOCKET_ROOMS.USER_PREFIX}${userId}`);
      this.logger.log(`User ${userId} disconnected from support`);
    }
  }

  @SubscribeMessage('joinAdminRoom')
  handleJoinAdminRoom(@ConnectedSocket() client: Socket) {
    client.join(SupportConstants.SOCKET_ROOMS.ADMIN);
    this.logger.log('Client joined admin room');
    return { event: 'joined', room: SupportConstants.SOCKET_ROOMS.ADMIN };
  }

  @SubscribeMessage('joinUserRoom')
  handleJoinUserRoom(
    @MessageBody('userId') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `${SupportConstants.SOCKET_ROOMS.USER_PREFIX}${userId}`;
    client.join(room);
    this.logger.log(`Client joined user room: ${room}`);
    return { event: 'joined', room };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody('room') room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room);
    this.logger.log(`Client left room: ${room}`);
    return { event: 'left', room };
  }

  /**
   * Notify admin room about new support message from user
   */
  notifyAdminNewMessage(payload: any) {
    this.logger.debug(
      `Broadcasting new message to admin room: ${JSON.stringify(payload)}`,
    );
    this.server
      .to(SupportConstants.SOCKET_ROOMS.ADMIN)
      .emit(SupportConstants.SOCKET_EVENTS.ADMIN_SUPPORT_MESSAGE, payload);
  }

  /**
   * Notify specific user about admin reply
   */
  notifyUserNewMessage(userId: string, payload: any) {
    const room = `${SupportConstants.SOCKET_ROOMS.USER_PREFIX}${userId}`;
    this.logger.debug(
      `Broadcasting admin reply to user room ${room}: ${JSON.stringify(payload)}`,
    );
    this.server
      .to(room)
      .emit(SupportConstants.SOCKET_EVENTS.USER_SUPPORT_MESSAGE, payload);
  }

  /**
   * Notify admin room about new inbox creation
   */
  notifyNewInbox(payload: any) {
    this.logger.debug(
      `Broadcasting new inbox to admin room: ${JSON.stringify(payload)}`,
    );
    this.server
      .to(SupportConstants.SOCKET_ROOMS.ADMIN)
      .emit(SupportConstants.SOCKET_EVENTS.NEW_SUPPORT_INBOX, payload);
  }

  /**
   * Notify about message read status
   */
  notifyMessageRead(userId: string, inboxId: string) {
    const userRoom = `${SupportConstants.SOCKET_ROOMS.USER_PREFIX}${userId}`;
    const payload = { inboxId, read: true };

    this.server
      .to(userRoom)
      .emit(SupportConstants.SOCKET_EVENTS.MESSAGE_READ, payload);
  }
}
