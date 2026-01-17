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
import { ChatConstants } from './chat.constants';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      // Join user's personal room
      const userRoom = `${ChatConstants.SOCKET_ROOMS.USER_PREFIX}${userId}`;
      client.join(userRoom);
      this.logger.log(
        `User ${userId} connected to chat, joined room: ${userRoom}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const userRoom = `${ChatConstants.SOCKET_ROOMS.USER_PREFIX}${userId}`;
      client.leave(userRoom);
      this.logger.log(`User ${userId} disconnected from chat`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() sendMessageDto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;

    if (!sendMessageDto.content || !sendMessageDto.channelId) {
      return { error: 'Invalid message data' };
    }

    const result = await this.chatService.sendMessage(userId, sendMessageDto);

    // Emit to the channel room
    this.broadcastMessage(sendMessageDto.channelId, result.data);

    return result;
  }

  @SubscribeMessage('joinChannel')
  handleJoinChannel(
    @MessageBody('channelId') channelId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `${ChatConstants.SOCKET_ROOMS.CHANNEL_PREFIX}${channelId}`;
    client.join(room);
    this.logger.log(`Client joined channel room: ${room}`);
    return { event: 'joined', channelId, room };
  }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(
    @MessageBody('channelId') channelId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `${ChatConstants.SOCKET_ROOMS.CHANNEL_PREFIX}${channelId}`;
    client.leave(room);
    this.logger.log(`Client left channel room: ${room}`);
    return { event: 'left', channelId };
  }

  @SubscribeMessage('markAsSeen')
  async handleMarkAsSeen(
    @MessageBody('channelId') channelId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    await this.chatService.markAsSeen(channelId, userId);

    this.notifyMessagesSeen(channelId, userId);

    return { event: 'messages_seen', channelId };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody('channelId') channelId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    const room = `${ChatConstants.SOCKET_ROOMS.CHANNEL_PREFIX}${channelId}`;

    client.to(room).emit(ChatConstants.SOCKET_EVENTS.TYPING, {
      channelId,
      userId,
    });

    return { event: 'typing', channelId };
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody('channelId') channelId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    const room = `${ChatConstants.SOCKET_ROOMS.CHANNEL_PREFIX}${channelId}`;

    client.to(room).emit(ChatConstants.SOCKET_EVENTS.STOP_TYPING, {
      channelId,
      userId,
    });

    return { event: 'stop_typing', channelId };
  }

  /**
   * Broadcast message to channel room
   */
  broadcastMessage(channelId: string, message: any) {
    const room = `${ChatConstants.SOCKET_ROOMS.CHANNEL_PREFIX}${channelId}`;
    this.logger.debug(`Broadcasting message to room ${room}`);
    this.server.to(room).emit(ChatConstants.SOCKET_EVENTS.MESSAGE, message);
  }

  /**
   * Notify that messages have been seen
   */
  notifyMessagesSeen(channelId: string, userId: string) {
    const room = `${ChatConstants.SOCKET_ROOMS.CHANNEL_PREFIX}${channelId}`;
    this.server.to(room).emit(ChatConstants.SOCKET_EVENTS.MARKED_AS_SEEN, {
      channelId,
      userId,
    });
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    const room = `${ChatConstants.SOCKET_ROOMS.USER_PREFIX}${userId}`;
    this.logger.debug(`Sending ${event} to user room ${room}`);
    this.server.to(room).emit(event, data);
  }

  /**
   * Notify new message to all channel participants
   */
  notifyNewMessage(channelId: string, participantIds: string[], message: any) {
    participantIds.forEach((userId) => {
      this.sendToUser(userId, ChatConstants.SOCKET_EVENTS.NEW_MESSAGE, {
        channelId,
        message,
      });
    });
  }
}
