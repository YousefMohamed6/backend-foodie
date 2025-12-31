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

  constructor(private readonly chatService: ChatService) {}

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

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() sendMessageDto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    const message = await this.chatService.sendMessage(userId, sendMessageDto);

    // Emit to the channel room
    this.server.to(sendMessageDto.channelId).emit('message', message);

    return message;
  }

  @SubscribeMessage('joinChannel')
  handleJoinChannel(
    @MessageBody('channelId') channelId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(channelId);
    return { event: 'joined', channelId };
  }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(
    @MessageBody('channelId') channelId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(channelId);
    return { event: 'left', channelId };
  }

  @SubscribeMessage('markAsSeen')
  async handleMarkAsSeen(
    @MessageBody('channelId') channelId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    await this.chatService.markAsSeen(channelId);
    this.server.to(channelId).emit('markedAsSeen', { channelId, userId });
    return { event: 'messages_seen', channelId };
  }
}
