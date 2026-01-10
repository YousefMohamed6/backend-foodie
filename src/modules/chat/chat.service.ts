import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatConstants } from './chat.constants';
import {
  CreateChannelDto,
  CreateOrderChatDto,
  SendMediaMessageDto,
  SendMessageDto,
} from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private prisma: PrismaService) { }

  async getChannels(userId: string) {
    return this.prisma.chatChannel.findMany({
      where: {
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureURL: true,
            role: true,
          },
        },
        order: true,
      },
      orderBy: {
        lastMessageTime: 'desc',
      },
    });
  }

  async getMessages(
    channelId: string,
    userId: string,
    query: { page?: string | number; limit?: string | number } = {},
  ) {
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: {
        participants: {
          select: { id: true },
        },
        order: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('CHANNEL_NOT_FOUND');
    }

    if (!channel.participants.some((p) => p.id === userId)) {
      throw new ForbiddenException('NOT_CHANNEL_PARTICIPANT');
    }

    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { channelId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureURL: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.chatMessage.count({ where: { channelId } }),
    ]);

    return {
      success: true,
      data: {
        channel: {
          id: channel.id,
          name: channel.name,
          chatType: channel.chatType,
          orderId: channel.orderId,
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

  async createChannel(userId: string, createChannelDto: CreateChannelDto) {
    const participantIds = Array.from(
      new Set([userId, ...createChannelDto.participantIds]),
    );

    return this.prisma.chatChannel.create({
      data: {
        name: createChannelDto.name,
        participants: {
          connect: participantIds.map((id) => ({ id })),
        },
      },
      include: {
        participants: true,
        order: true,
      },
    });
  }

  /**
   * Create or get existing chat channel for an order
   */
  async createOrderChat(userId: string, dto: CreateOrderChatDto) {
    this.logger.debug(
      `Creating order chat for order ${dto.orderId}, type: ${dto.chatType}`,
    );

    // Get the order with all related info
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureURL: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureURL: true,
          },
        },
        vendor: {
          select: {
            id: true,
            title: true,
            logo: true,
            authorId: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    // Determine participants based on chat type
    let participantIds: string[] = [];
    let channelData: any = {
      orderId: order.id,
      chatType: dto.chatType,
      customerId: order.author.id,
      customerName: `${order.author.firstName} ${order.author.lastName}`,
      customerProfileImage: order.author.profilePictureURL,
    };

    if (dto.chatType === ChatConstants.CHAT_TYPES.CUSTOMER_VENDOR) {
      participantIds = [order.author.id, order.vendor.authorId];
      channelData = {
        ...channelData,
        restaurantId: order.vendorId,
        restaurantName: order.vendor.title,
        restaurantProfileImage: order.vendor.logo,
        name: `Order #${order.id.slice(-6)} - ${order.vendor.title}`,
      };
    } else if (dto.chatType === ChatConstants.CHAT_TYPES.CUSTOMER_DRIVER) {
      if (!order.driver) {
        throw new BadRequestException('ORDER_NO_DRIVER_ASSIGNED');
      }
      participantIds = [order.author.id, order.driver.id];
      channelData = {
        ...channelData,
        driverId: order.driver.id,
        driverName: `${order.driver.firstName} ${order.driver.lastName}`,
        driverProfileImage: order.driver.profilePictureURL,
        name: `Order #${order.id.slice(-6)} - Driver`,
      };
    }

    // Check if channel already exists for this order and chat type
    let channel = await this.prisma.chatChannel.findFirst({
      where: {
        orderId: order.id,
        chatType: dto.chatType,
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureURL: true,
            role: true,
          },
        },
        messages: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!channel) {
      // Create new channel
      channel = await this.prisma.chatChannel.create({
        data: {
          ...channelData,
          participants: {
            connect: participantIds.map((id) => ({ id })),
          },
        },
        include: {
          participants: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureURL: true,
              role: true,
            },
          },
          messages: true,
        },
      });
      this.logger.log(
        `Created new ${dto.chatType} chat channel for order ${order.id}`,
      );
    }

    return {
      success: true,
      data: {
        ...channel,
        messages: channel.messages?.reverse() || [],
      },
    };
  }

  async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: sendMessageDto.channelId },
      include: {
        participants: {
          select: { id: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('CHANNEL_NOT_FOUND');
    }

    if (!channel.participants.some((p) => p.id === userId)) {
      throw new ForbiddenException('NOT_CHANNEL_PARTICIPANT');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          channelId: sendMessageDto.channelId,
          senderId: userId,
          content: sendMessageDto.content,
          messageType: ChatConstants.MESSAGE_TYPES.TEXT,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureURL: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.chatChannel.update({
        where: { id: sendMessageDto.channelId },
        data: {
          lastMessageText: sendMessageDto.content,
          lastMessageTime: new Date(),
          lastMessageType: ChatConstants.MESSAGE_TYPES.TEXT,
        },
        include: { order: true },
      }),
    ]);

    return {
      success: true,
      data: message,
    };
  }

  /**
   * Send media message (text, image, or video) with file upload
   */
  async sendMediaMessage(
    userId: string,
    dto: SendMediaMessageDto,
    file?: Express.Multer.File,
    videoThumbnail?: Express.Multer.File,
  ) {
    this.logger.debug(
      `User ${userId} sending ${dto.type} message to channel ${dto.channelId}`,
    );

    // Validate based on type
    this.validateMessageData(dto, file);

    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: dto.channelId },
      include: {
        participants: {
          select: { id: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('CHANNEL_NOT_FOUND');
    }

    if (!channel.participants.some((p) => p.id === userId)) {
      throw new ForbiddenException('NOT_CHANNEL_PARTICIPANT');
    }

    let filePath: string | null = null;
    let thumbnailPath: string | null = null;

    // Handle file upload if present
    if (file) {
      filePath = await this.saveFile(dto.channelId, userId, file);
    }

    // Handle video thumbnail if present
    if (videoThumbnail && dto.type === ChatConstants.MESSAGE_TYPES.VIDEO) {
      thumbnailPath = await this.saveFile(
        dto.channelId,
        userId,
        videoThumbnail,
        'thumbnails',
      );
    }

    const lastMessagePreview = this.getLastMessagePreview(dto, filePath);

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          channelId: dto.channelId,
          senderId: userId,
          content: dto.content,
          messageType: dto.type,
          filePath: filePath,
          videoThumbnail: thumbnailPath,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureURL: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.chatChannel.update({
        where: { id: dto.channelId },
        data: {
          lastMessageText: lastMessagePreview,
          lastMessageTime: new Date(),
          lastMessageType: dto.type,
        },
      }),
    ]);

    this.logger.log(
      `Message ${message.id} sent to channel ${dto.channelId}`,
    );

    return {
      success: true,
      data: message,
    };
  }

  async markAsSeen(channelId: string, userId: string) {
    // Update all unread messages not sent by this user
    await this.prisma.chatMessage.updateMany({
      where: {
        channelId,
        isRead: false,
        senderId: { not: userId },
      },
      data: {
        isRead: true,
      },
    });
    return { success: true, message: 'Messages marked as seen' };
  }

  async getAdminThreads(userId: string) {
    return this.prisma.chatChannel.findMany({
      where: {
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: true,
        order: true,
      },
      orderBy: {
        lastMessageTime: 'desc',
      },
    });
  }

  async createAdminChannel(userId: string, createChannelDto: CreateChannelDto) {
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      throw new NotFoundException('ADMIN_NOT_FOUND');
    }

    const participantIds = Array.from(
      new Set([userId, admin.id, ...(createChannelDto.participantIds || [])]),
    );

    return this.prisma.chatChannel.create({
      data: {
        name: createChannelDto.name || 'Admin Chat',
        chatType: ChatConstants.CHAT_TYPES.ADMIN,
        participants: {
          connect: participantIds.map((id) => ({ id })),
        },
      },
      include: {
        participants: true,
      },
    });
  }

  async sendAdminMessage(userId: string, sendMessageDto: SendMessageDto) {
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: sendMessageDto.channelId },
      include: {
        participants: {
          select: { id: true, role: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('CHANNEL_NOT_FOUND');
    }

    const hasAdmin = channel.participants.some((p) => p.role === 'ADMIN');
    if (!hasAdmin) {
      throw new ForbiddenException('NOT_ADMIN_CHANNEL');
    }

    if (!channel.participants.some((p) => p.id === userId)) {
      throw new ForbiddenException('NOT_CHANNEL_PARTICIPANT');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          channelId: sendMessageDto.channelId,
          senderId: userId,
          content: sendMessageDto.content,
          messageType: ChatConstants.MESSAGE_TYPES.TEXT,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureURL: true,
            },
          },
        },
      }),
      this.prisma.chatChannel.update({
        where: { id: sendMessageDto.channelId },
        data: {
          lastMessageText: sendMessageDto.content,
          lastMessageTime: new Date(),
        },
      }),
    ]);

    return message;
  }

  /**
   * Get order chats for a user (both vendor and driver chats)
   */
  async getOrderChats(orderId: string, userId: string) {
    const channels = await this.prisma.chatChannel.findMany({
      where: {
        orderId,
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureURL: true,
            role: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return {
      success: true,
      data: channels,
    };
  }

  private validateMessageData(
    dto: SendMediaMessageDto,
    file?: Express.Multer.File,
  ) {
    if (dto.type === ChatConstants.MESSAGE_TYPES.TEXT) {
      if (!dto.content || dto.content.trim() === '') {
        throw new BadRequestException('CHAT_MESSAGE_REQUIRED');
      }
    } else if (
      dto.type === ChatConstants.MESSAGE_TYPES.IMAGE ||
      dto.type === ChatConstants.MESSAGE_TYPES.VIDEO
    ) {
      if (!file) {
        throw new BadRequestException('CHAT_FILE_REQUIRED');
      }
    }

    if ((!dto.content || dto.content.trim() === '') && !file) {
      throw new BadRequestException('CHAT_EMPTY_MESSAGE');
    }
  }

  private async saveFile(
    channelId: string,
    userId: string,
    file: Express.Multer.File,
    subFolder: string = '',
  ): Promise<string> {
    const timestamp = Date.now();
    const ext = extname(file.originalname);
    const filename = `${timestamp}${ext}`;

    const uploadDir = join(
      process.cwd(),
      ChatConstants.UPLOAD_PATH,
      channelId,
      subFolder,
    );

    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, filename);
    writeFileSync(filePath, file.buffer);

    const relativePath = join(
      ChatConstants.UPLOAD_PATH,
      channelId,
      subFolder,
      filename,
    ).replace(/\\/g, '/');

    this.logger.debug(`File saved to: ${relativePath}`);

    return `/${relativePath}`;
  }

  private getLastMessagePreview(
    dto: SendMediaMessageDto,
    filePath: string | null,
  ): string {
    if (dto.type === ChatConstants.MESSAGE_TYPES.TEXT && dto.content) {
      return dto.content.substring(0, 100);
    }
    if (dto.type === ChatConstants.MESSAGE_TYPES.IMAGE) {
      return '[Image]';
    }
    if (dto.type === ChatConstants.MESSAGE_TYPES.VIDEO) {
      return '[Video]';
    }
    return '';
  }
}
