import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChannelDto, SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

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
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    return this.prisma.chatMessage.findMany({
      where: { channelId },
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
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
        include: { order: true },
      }),
    ]);

    return message;
  }

  async markAsSeen(channelId: string) {
    await this.prisma.chatMessage.updateMany({
      where: {
        channelId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
    return { message: 'Messages marked as seen' };
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
    // Admin channel: user + admin
    // Find admin user
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
    // Verify it's an admin channel
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

    // Check if channel has admin participant
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
}
