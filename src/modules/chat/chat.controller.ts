import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateChannelDto, SendMessageDto } from './dto/chat.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('threads')
  @ApiOperation({ summary: 'Get user chat threads' })
  getThreads(@Request() req) {
    return this.chatService.getChannels(req.user.id);
  }

  @Get('admin/threads')
  @ApiOperation({ summary: 'Get admin chat threads' })
  getAdminThreads(@Request() req) {
    return this.chatService.getAdminThreads(req.user.id);
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: 'Get thread messages' })
  getMessages(
    @Param('id') id: string,
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(id, req.user.id, { page, limit });
  }

  @Patch('threads/:id/seen')
  @ApiOperation({ summary: 'Mark thread messages as seen' })
  markAsSeen(@Param('id') id: string) {
    return this.chatService.markAsSeen(id);
  }

  @Post('threads')
  @ApiOperation({ summary: 'Create a new chat thread' })
  createThread(@Body() createChannelDto: CreateChannelDto, @Request() req) {
    return this.chatService.createChannel(req.user.id, createChannelDto);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a chat message' })
  sendMessage(@Body() sendMessageDto: SendMessageDto, @Request() req) {
    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  @Post('admin/channels')
  @ApiOperation({ summary: 'Create admin chat channel' })
  createAdminChannel(
    @Body() createChannelDto: CreateChannelDto,
    @Request() req,
  ) {
    return this.chatService.createAdminChannel(req.user.id, createChannelDto);
  }

  @Post('admin/messages')
  @ApiOperation({ summary: 'Send message to admin' })
  sendAdminMessage(@Body() sendMessageDto: SendMessageDto, @Request() req) {
    return this.chatService.sendAdminMessage(req.user.id, sendMessageDto);
  }
}
