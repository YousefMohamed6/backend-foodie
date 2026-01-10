import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
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
import { UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ComplaintDto } from './dto/complaint.dto';
import { ContactDto } from './dto/contact.dto';
import { SendSupportMessageDto } from './dto/send-support-message.dto';
import { SupportConstants } from './support.constants';
import { SupportGateway } from './support.gateway';
import { SupportService, SupportUserInfo } from './support.service';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly supportGateway: SupportGateway,
  ) { }

  @Post('contact')
  @ApiOperation({ summary: 'Send contact message (public)' })
  contact(@Body() data: ContactDto) {
    return { message: 'Message sent successfully' };
  }

  @Post('complaints')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send a complaint' })
  complaint(@Body() data: ComplaintDto, @Request() req: any) {
    return {
      message: 'Complaint submitted successfully',
      id: Math.random().toString(36).substring(7),
    };
  }

  @Post('message')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send support message (text, image, or video)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Text message (required for text type)' },
        type: { type: 'string', enum: ['TEXT', 'IMAGE', 'VIDEO'], description: 'Message type' },
        file: { type: 'string', format: 'binary', description: 'Image or video file' },
        videoThumbnail: { type: 'string', format: 'binary', description: 'Video thumbnail' },
      },
      required: ['type'],
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
        limits: { fileSize: SupportConstants.MAX_FILE_SIZE },
        fileFilter: (req, file, cb) => {
          const allowedMimes = [
            ...SupportConstants.ALLOWED_IMAGE_MIMES,
            ...SupportConstants.ALLOWED_VIDEO_MIMES,
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
  async sendMessage(
    @Request() req: any,
    @Body() dto: SendSupportMessageDto,
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; videoThumbnail?: Express.Multer.File[] },
  ) {
    const userInfo: SupportUserInfo = {
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userImage: req.user.profilePictureURL,
    };

    const file = files?.file?.[0];
    const videoThumbnail = files?.videoThumbnail?.[0];

    const result = await this.supportService.sendMessage(
      userInfo,
      dto,
      file,
      videoThumbnail,
    );

    // Broadcast to admin room via WebSocket
    this.supportGateway.notifyAdminNewMessage({
      ...result.data,
      userId: userInfo.userId,
      userName: userInfo.userName,
      userImage: userInfo.userImage,
    });

    return result;
  }

  @Post('admin/reply/:inboxId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin reply to support message' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Text message (required for text type)' },
        type: { type: 'string', enum: ['TEXT', 'IMAGE', 'VIDEO'], description: 'Message type' },
        file: { type: 'string', format: 'binary', description: 'Image or video file' },
        videoThumbnail: { type: 'string', format: 'binary', description: 'Video thumbnail' },
      },
      required: ['type'],
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
        limits: { fileSize: SupportConstants.MAX_FILE_SIZE },
        fileFilter: (req, file, cb) => {
          const allowedMimes = [
            ...SupportConstants.ALLOWED_IMAGE_MIMES,
            ...SupportConstants.ALLOWED_VIDEO_MIMES,
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
  async adminReply(
    @Request() req: any,
    @Param('inboxId') inboxId: string,
    @Body() dto: SendSupportMessageDto,
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; videoThumbnail?: Express.Multer.File[] },
  ) {
    const file = files?.file?.[0];
    const videoThumbnail = files?.videoThumbnail?.[0];

    const result = await this.supportService.sendAdminReply(
      req.user.id,
      `${req.user.firstName} ${req.user.lastName}`,
      inboxId,
      dto,
      file,
      videoThumbnail,
    );

    // Broadcast to user room via WebSocket
    this.supportGateway.notifyUserNewMessage(result.data.userId, {
      ...result.data,
      adminId: req.user.id,
      adminName: `${req.user.firstName} ${req.user.lastName}`,
    });

    return result;
  }

  @Get('admin/inboxes')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all support inboxes (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getInboxList(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.supportService.getInboxList(+page, +limit);
  }

  @Get('admin/messages/:inboxId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get messages for an inbox (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMessages(
    @Param('inboxId') inboxId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.supportService.getMessages(inboxId, +page, +limit);
  }

  @Post('admin/read/:inboxId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark inbox as read (admin only)' })
  async markAsRead(@Param('inboxId') inboxId: string) {
    return this.supportService.markAsRead(inboxId);
  }

  @Get('my-inbox')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user support inbox and messages' })
  async getMyInbox(@Request() req: any) {
    return this.supportService.getUserInbox(req.user.id);
  }
}
