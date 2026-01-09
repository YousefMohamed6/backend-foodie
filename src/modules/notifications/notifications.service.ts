import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, type?: string) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (type) {
      where.type = type;
    }
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByType(userId: string, type: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
    });
    return notification;
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });
    if (!notification) {
      throw new NotFoundException('NOTIFICATION_NOT_FOUND');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async remove(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });
    if (!notification) {
      throw new NotFoundException('NOTIFICATION_NOT_FOUND');
    }
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async clearAll(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return { message: 'All notifications cleared' };
  }

  async create(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({
      data,
    });
  }

  async getTemplate(type: string) {
    // Get notification template from settings or return default
    const template = await this.prisma.setting.findUnique({
      where: { key: `notification_template_${type}` },
    });

    if (template) {
      const value = JSON.parse(template.value || '{}') as {
        subject?: string;
        message?: string;
      };
      return {
        id: template.key,
        type,
        subject: value.subject || 'Notification',
        message: value.message || 'Notification setup is pending',
      };
    }

    // Return default template
    return {
      id: '',
      type,
      subject: 'setup notification',
      message: 'Notification setup is pending',
    };
  }
}
