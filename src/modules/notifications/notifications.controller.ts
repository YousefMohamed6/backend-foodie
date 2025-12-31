import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  findAll(@Request() req, @Query('type') type?: string) {
    return this.notificationsService.findAll(req.user.id, type);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get notification by type' })
  findByType(@Request() req, @Param('type') type: string) {
    return this.notificationsService.findByType(req.user.id, type);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(req.user.id, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all notifications' })
  clearAll(@Request() req) {
    return this.notificationsService.clearAll(req.user.id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get notification template by type' })
  @ApiQuery({ name: 'type', required: true, description: 'Notification type' })
  getTemplate(@Query('type') type: string) {
    return this.notificationsService.getTemplate(type);
  }
}
