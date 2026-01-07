import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificationService } from '../../shared/services/notification.service';
import {
  SendCustomNotificationDto,
  SendRoleNotificationDto,
} from './dto/send-notification.dto';

@ApiTags('Admin - Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post('send-to-customers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send notification to all customers',
    description:
      'Send a broadcast notification to all active customers. Messages must be provided in both Arabic and English.',
  })
  async sendToCustomers(@Body() dto: SendRoleNotificationDto) {
    const result = await this.notificationService.sendToRole(
      UserRole.CUSTOMER,
      dto.title,
      dto.message,
      dto.data,
    );

    return {
      message: 'Notification sent to customers',
      ...result,
    };
  }

  @Post('send-to-vendors')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send notification to all vendors',
    description:
      'Send a broadcast notification to all active vendors. Messages must be provided in both Arabic and English.',
  })
  async sendToVendors(@Body() dto: SendRoleNotificationDto) {
    const result = await this.notificationService.sendToRole(
      UserRole.VENDOR,
      dto.title,
      dto.message,
      dto.data,
    );

    return {
      message: 'Notification sent to vendors',
      ...result,
    };
  }

  @Post('send-to-drivers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send notification to all drivers',
    description:
      'Send a broadcast notification to all active drivers. Messages must be provided in both Arabic and English.',
  })
  async sendToDrivers(@Body() dto: SendRoleNotificationDto) {
    const result = await this.notificationService.sendToRole(
      UserRole.DRIVER,
      dto.title,
      dto.message,
      dto.data,
    );

    return {
      message: 'Notification sent to drivers',
      ...result,
    };
  }

  @Post('send-custom')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send notification to specific users',
    description:
      'Send a notification to a list of specific users by their IDs. Messages must be provided in both Arabic and English.',
  })
  async sendCustom(@Body() dto: SendCustomNotificationDto) {
    const result = await this.notificationService.sendCustomNotification(
      dto.userIds,
      dto.title,
      dto.message,
      dto.data,
    );

    return {
      message: 'Custom notification sent',
      ...result,
    };
  }
}
