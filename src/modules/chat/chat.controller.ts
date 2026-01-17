import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatConstants } from './chat.constants';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import {
  CreateChannelDto,
  CreateOrderChatDto,
  SendMediaMessageDto,
  SendMessageDto,
} from './dto/chat.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('threads')
  @ApiOperation({ summary: 'Get user chat threads' })
  getThreads(@Request() req: any) {
    return this.chatService.getChannels(req.user.id);
  }

  @Get('admin/threads')
  @ApiOperation({ summary: 'Get admin chat threads' })
  getAdminThreads(@Request() req: any) {
    return this.chatService.getAdminThreads(req.user.id);
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: 'Get thread messages' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMessages(
    @Param('id') id: string,
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(id, req.user.id, { page, limit });
  }

  @Patch('threads/:id/seen')
  @ApiOperation({ summary: 'Mark thread messages as seen' })
  async markAsSeen(@Param('id') id: string, @Request() req: any) {
    const result = await this.chatService.markAsSeen(id, req.user.id);

    // Notify other participants via WebSocket
    this.chatGateway.notifyMessagesSeen(id, req.user.id);

    return result;
  }

  @Post('threads')
  @ApiOperation({ summary: 'Create a new chat thread' })
  createThread(
    @Body() createChannelDto: CreateChannelDto,
    @Request() req: any,
  ) {
    return this.chatService.createChannel(req.user.id, createChannelDto);
  }

  @Post('order-chat')
  @ApiOperation({
    summary: 'Create or get chat channel for an order (vendor or driver)',
  })
  createOrderChat(@Body() dto: CreateOrderChatDto, @Request() req: any) {
    return this.chatService.createOrderChat(req.user.id, dto);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get all chat channels for an order' })
  getOrderChats(@Param('orderId') orderId: string, @Request() req: any) {
    return this.chatService.getOrderChats(orderId, req.user.id);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a text chat message' })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: any,
  ) {
    const result = await this.chatService.sendMessage(
      req.user.id,
      sendMessageDto,
    );

    // Broadcast to channel via WebSocket
    this.chatGateway.broadcastMessage(sendMessageDto.channelId, result.data);

    return result;
  }

  @Post('media-message')
  @ApiOperation({ summary: 'Send media message (text, image, or video)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Channel ID' },
        content: {
          type: 'string',
          description: 'Text message (optional for media)',
        },
        type: {
          type: 'string',
          enum: ['TEXT', 'IMAGE', 'VIDEO'],
          description: 'Message type',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image or video file',
        },
        videoThumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Video thumbnail',
        },
      },
      required: ['channelId', 'type'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'videoThumbnail', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: ChatConstants.MAX_FILE_SIZE },
        fileFilter: (req, file, cb) => {
          const allowedMimes = [
            ...ChatConstants.ALLOWED_IMAGE_MIMES,
            ...ChatConstants.ALLOWED_VIDEO_MIMES,
          ];
          if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new BadRequestException('UNSUPPORTED_FILE_TYPE'), false);
          }
        },
      },
    ),
  )
  async sendMediaMessage(
    @Request() req: any,
    @Body() dto: SendMediaMessageDto,
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      videoThumbnail?: Express.Multer.File[];
    },
  ) {
    const file = files?.file?.[0];
    const videoThumbnail = files?.videoThumbnail?.[0];

    const result = await this.chatService.sendMediaMessage(
      req.user.id,
      dto,
      file,
      videoThumbnail,
    );

    // Broadcast to channel via WebSocket
    this.chatGateway.broadcastMessage(dto.channelId, result.data);

    return result;
  }

  @Post('admin/channels')
  @ApiOperation({ summary: 'Create admin chat channel' })
  createAdminChannel(
    @Body() createChannelDto: CreateChannelDto,
    @Request() req: any,
  ) {
    return this.chatService.createAdminChannel(req.user.id, createChannelDto);
  }

  @Post('admin/messages')
  @ApiOperation({ summary: 'Send message to admin' })
  async sendAdminMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: any,
  ) {
    const message = await this.chatService.sendAdminMessage(
      req.user.id,
      sendMessageDto,
    );

    // Broadcast to channel via WebSocket
    this.chatGateway.broadcastMessage(sendMessageDto.channelId, message);

    return message;
  }
}
