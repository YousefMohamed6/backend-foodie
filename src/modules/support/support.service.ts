import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupportMessageType } from '@prisma/client';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { SendSupportMessageDto } from './dto/send-support-message.dto';
import { SupportConstants } from './support.constants';

export interface SupportUserInfo {
  userId: string;
  userName: string;
  userImage?: string;
  userRole: string;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private prisma: PrismaService) { }

  async sendMessage(
    userInfo: SupportUserInfo,
    dto: SendSupportMessageDto,
    file?: Express.Multer.File,
    videoThumbnail?: Express.Multer.File,
  ) {
    this.logger.debug(
      `User ${userInfo.userId} sending support message type: ${dto.type}`,
    );

    // Validate based on type
    this.validateMessageData(dto, file);

    let filePath: string | null = null;
    let thumbnailPath: string | null = null;

    // Handle file upload if present
    if (file) {
      filePath = await this.saveFile(userInfo.userId, file);
    }

    // Handle video thumbnail if present
    if (videoThumbnail && dto.type === SupportMessageType.VIDEO) {
      thumbnailPath = await this.saveFile(
        userInfo.userId,
        videoThumbnail,
        'thumbnails',
      );
    }

    // Find or create inbox for this user
    let inbox = await this.prisma.supportInbox.findFirst({
      where: { userId: userInfo.userId },
    });

    if (!inbox) {
      inbox = await this.prisma.supportInbox.create({
        data: {
          userId: userInfo.userId,
          userName: userInfo.userName,
          userProfileImage: userInfo.userImage,
          lastMessage: this.getLastMessagePreview(dto, filePath),
          lastMessageType: dto.type,
          lastSenderId: userInfo.userId,
        },
      });
      this.logger.log(`Created new support inbox for user ${userInfo.userId}`);
    }

    // Create the message
    const message = await this.prisma.supportMessage.create({
      data: {
        inboxId: inbox.id,
        senderId: userInfo.userId,
        senderName: userInfo.userName,
        senderRole: userInfo.userRole,
        type: dto.type,
        message: dto.message,
        filePath: filePath,
        videoThumbnail: thumbnailPath,
      },
    });

    // Update inbox with last message info and profile image if missing
    await this.prisma.supportInbox.update({
      where: { id: inbox.id },
      data: {
        lastMessage: this.getLastMessagePreview(dto, filePath),
        lastMessageType: dto.type,
        lastSenderId: userInfo.userId,
        isRead: false,
        updatedAt: new Date(),
        // Update profile image if it was missing
        ...(userInfo.userImage && !inbox.userProfileImage
          ? { userProfileImage: userInfo.userImage }
          : {}),
      },
    });

    this.logger.log(`Support message ${message.id} created successfully`);

    return {
      success: true,
      data: {
        messageId: message.id,
        inboxId: inbox.id,
        type: message.type,
        message: message.message,
        filePath: message.filePath,
        videoThumbnail: message.videoThumbnail,
        createdAt: message.createdAt,
      },
    };
  }

  async sendAdminReply(
    adminId: string,
    adminName: string,
    inboxId: string,
    dto: SendSupportMessageDto,
    file?: Express.Multer.File,
    videoThumbnail?: Express.Multer.File,
  ) {
    this.logger.debug(
      `Admin ${adminId} replying to inbox ${inboxId} with type: ${dto.type}`,
    );

    // Validate based on type
    this.validateMessageData(dto, file);

    // Find the inbox
    const inbox = await this.prisma.supportInbox.findUnique({
      where: { id: inboxId },
    });

    if (!inbox) {
      throw new NotFoundException('SUPPORT_INBOX_NOT_FOUND');
    }

    let filePath: string | null = null;
    let thumbnailPath: string | null = null;

    // Handle file upload if present
    if (file) {
      filePath = await this.saveFile(inbox.userId, file, 'admin');
    }

    // Handle video thumbnail if present
    if (videoThumbnail && dto.type === SupportMessageType.VIDEO) {
      thumbnailPath = await this.saveFile(
        inbox.userId,
        videoThumbnail,
        'admin/thumbnails',
      );
    }

    // Create the message
    const message = await this.prisma.supportMessage.create({
      data: {
        inboxId: inbox.id,
        senderId: adminId,
        senderName: adminName,
        senderRole: 'ADMIN',
        type: dto.type,
        message: dto.message,
        filePath: filePath,
        videoThumbnail: thumbnailPath,
      },
    });

    // Update inbox with last message info and admin info
    await this.prisma.supportInbox.update({
      where: { id: inbox.id },
      data: {
        adminId: adminId,
        adminName: adminName,
        lastMessage: this.getLastMessagePreview(dto, filePath),
        lastMessageType: dto.type,
        lastSenderId: adminId,
        isRead: true,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Admin reply message ${message.id} created successfully`);

    return {
      success: true,
      data: {
        messageId: message.id,
        inboxId: inbox.id,
        userId: inbox.userId,
        type: message.type,
        message: message.message,
        filePath: message.filePath,
        videoThumbnail: message.videoThumbnail,
        createdAt: message.createdAt,
      },
    };
  }

  async getInboxList(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [inboxes, total] = await Promise.all([
      this.prisma.supportInbox.findMany({
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      }),
      this.prisma.supportInbox.count(),
    ]);

    return {
      success: true,
      data: inboxes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMessages(inboxId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const inbox = await this.prisma.supportInbox.findUnique({
      where: { id: inboxId },
    });

    if (!inbox) {
      throw new NotFoundException('SUPPORT_INBOX_NOT_FOUND');
    }

    const [messages, total] = await Promise.all([
      this.prisma.supportMessage.findMany({
        where: { inboxId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportMessage.count({ where: { inboxId } }),
    ]);

    return {
      success: true,
      data: {
        inbox: {
          id: inbox.id,
          userId: inbox.userId,
          userName: inbox.userName,
          userProfileImage: inbox.userProfileImage,
        },
        messages: messages.reverse(),
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserInbox(userId: string) {
    const inbox = await this.prisma.supportInbox.findFirst({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    if (!inbox) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: inbox,
    };
  }

  async markAsRead(inboxId: string) {
    await this.prisma.supportInbox.update({
      where: { id: inboxId },
      data: { isRead: true },
    });

    return { success: true };
  }

  private validateMessageData(
    dto: SendSupportMessageDto,
    file?: Express.Multer.File,
  ) {
    if (dto.type === SupportMessageType.TEXT) {
      if (!dto.message || dto.message.trim() === '') {
        throw new BadRequestException('SUPPORT_MESSAGE_REQUIRED');
      }
    } else if (
      dto.type === SupportMessageType.IMAGE ||
      dto.type === SupportMessageType.VIDEO
    ) {
      if (!file) {
        throw new BadRequestException('SUPPORT_FILE_REQUIRED');
      }
    }

    // Validate that at least one of message or file is provided
    if ((!dto.message || dto.message.trim() === '') && !file) {
      throw new BadRequestException('SUPPORT_EMPTY_MESSAGE');
    }
  }

  private async saveFile(
    userId: string,
    file: Express.Multer.File,
    subFolder: string = '',
  ): Promise<string> {
    const timestamp = Date.now();
    const ext = extname(file.originalname);
    const filename = `${timestamp}${ext}`;

    const uploadDir = join(
      process.cwd(),
      SupportConstants.UPLOAD_PATH,
      userId,
      subFolder,
    );

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, filename);

    // Write file to disk
    writeFileSync(filePath, file.buffer);

    // Return relative path for storage
    const relativePath = join(
      SupportConstants.UPLOAD_PATH,
      userId,
      subFolder,
      filename,
    ).replace(/\\/g, '/');

    this.logger.debug(`File saved to: ${relativePath}`);

    return `/${relativePath}`;
  }

  private getLastMessagePreview(
    dto: SendSupportMessageDto,
    filePath: string | null,
  ): string {
    if (dto.type === SupportMessageType.TEXT && dto.message) {
      return dto.message.substring(0, 100);
    }
    if (dto.type === SupportMessageType.IMAGE) {
      return '[صورة]';
    }
    if (dto.type === SupportMessageType.VIDEO) {
      return '[فيديو]';
    }
    return '';
  }
}
