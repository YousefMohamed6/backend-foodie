import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../services/notification.service';

@Processor('order-processing')
export class ProcessOrderProcessor {
  private readonly logger = new Logger(ProcessOrderProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) { }

  @Process('update-vendor-wallet')
  async handleUpdateVendorWallet(job: Job<{ orderId: string }>) {
    this.logger.log(`Processing vendor wallet update for order ${job.data.orderId}`);

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: job.data.orderId },
        include: { vendor: true },
      });

      if (!order) {
        throw new Error(`Order ${job.data.orderId} not found`);
      }

      // Calculate vendor earnings (after commission)
      // This is a simplified version - implement full logic based on your business rules
      const vendorEarnings = Number(order.totalAmount) * 0.85; // 85% to vendor, 15% commission

      // Update vendor wallet
      await this.prisma.vendor.update({
        where: { id: order.vendorId },
        data: {
          walletAmount: {
            increment: vendorEarnings,
          },
        },
      });

      // Create wallet transaction record
      await this.prisma.walletTransaction.create({
        data: {
          userId: order.vendor.authorId,
          amount: vendorEarnings,
          type: TransactionType.DEPOSIT,
          paymentMethod: 'wallet',
          isTopup: true,
          orderId: order.id,
          transactionUser: 'vendor',
          description: 'Order payment credited',
          paymentStatus: 'success',
        },
      });

      this.logger.log(`Vendor wallet updated for order ${job.data.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to update vendor wallet:`, error);
      throw error;
    }
  }

  @Process('send-order-notifications')
  async handleSendOrderNotifications(job: Job<{ orderId: string; status: string }>) {
    this.logger.log(`Sending notifications for order ${job.data.orderId}`);

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: job.data.orderId },
        include: { author: true, vendor: { include: { author: true } } },
      });

      if (!order) {
        throw new Error(`Order ${job.data.orderId} not found`);
      }

      // Notify customer
      await this.notificationService.sendNotification(
        order.authorId,
        'Order Status Update',
        `Your order status has been updated to: ${job.data.status}`,
        'order_status',
        { orderId: order.id, status: job.data.status },
      );

      // Notify vendor
      if (order.vendor?.author?.fcmToken) {
        await this.notificationService.sendPush(
          order.vendor.author.fcmToken,
          'New Order Update',
          `Order ${order.id} status: ${job.data.status}`,
          { orderId: order.id, status: job.data.status },
        );
      }

      this.logger.log(`Notifications sent for order ${job.data.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send order notifications:`, error);
      throw error;
    }
  }
}

