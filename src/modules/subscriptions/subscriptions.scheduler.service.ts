import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable()
export class SubscriptionsSchedulerService {
    private readonly logger = new Logger(SubscriptionsSchedulerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
        private readonly i18n: I18nService,
    ) { }

    /**
     * Check for expired vendor subscriptions and deactivate them.
     * Runs every day at midnight.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleExpiredSubscriptions() {
        this.logger.log('Checking for expired vendor subscriptions...');

        const now = new Date();

        try {
            // Find all vendors with expired subscriptions
            const expiredVendors = await this.prisma.vendor.findMany({
                where: {
                    subscriptionExpiryDate: {
                        lt: now,
                    },
                    subscriptionPlanId: {
                        not: null,
                    },
                },
                include: {
                    subscriptionPlan: true,
                    subscription: true,
                },
            });

            if (expiredVendors.length === 0) {
                this.logger.log('No expired vendor subscriptions found.');
                return;
            }

            this.logger.log(
                `Found ${expiredVendors.length} vendors with expired subscriptions.`,
            );

            // Get the free plan to assign to expired vendors
            const freePlan = await this.prisma.subscriptionPlan.findFirst({
                where: {
                    price: 0,
                    isActive: true,
                },
            });

            // Process each expired vendor
            for (const vendor of expiredVendors) {
                await this.prisma.$transaction(async (tx) => {
                    // Update the subscription status to EXPIRED
                    if (vendor.subscriptionId) {
                        await tx.subscription.update({
                            where: { id: vendor.subscriptionId },
                            data: { status: SubscriptionStatus.EXPIRED },
                        });
                    }

                    // Reset vendor subscription to free plan or null
                    const updateData: any = {
                        subscriptionPlanId: freePlan?.id || null,
                        subscriptionExpiryDate: null,
                        subscriptionTotalOrders: freePlan?.totalOrders ?? -1, // Use -1 for unlimited if no free plan found
                        subscriptionId: null,
                    };

                    await tx.vendor.update({
                        where: { id: vendor.id },
                        data: updateData,
                    });

                    // Also clear user's subscription fields to keep them in sync
                    await tx.user.update({
                        where: { id: vendor.authorId },
                        data: {
                            subscriptionPlanId: freePlan?.id || null,
                            subscriptionExpiryDate: null,
                        },
                    });

                    // Log the subscription event (if we have the subscription record)
                    if (vendor.subscription && vendor.subscriptionId) {
                        await tx.subscriptionEventLog.create({
                            data: {
                                subscriptionId: vendor.subscriptionId,
                                vendorId: vendor.id,
                                userId: vendor.authorId,
                                eventType: 'EXPIRED',
                                previousPlanId: vendor.subscriptionPlanId,
                                newPlanId: freePlan?.id || 'NONE',
                                planName: vendor.subscriptionPlan?.name || 'Expired Plan',
                                planPrice: vendor.subscriptionPlan?.price || 0,
                                amountPaid: 0,
                                startDate: vendor.subscription.startDate,
                                endDate: vendor.subscription.endDate,
                                metadata: {
                                    reason: 'Subscription period expired',
                                    expiredAt: now.toISOString(),
                                    assignedFreePlan: freePlan?.id || null,
                                },
                            },
                        });
                    }

                    this.logger.log(
                        `Deactivated subscription for vendor: ${vendor.id} (${vendor.title})`,
                    );
                });
            }

            this.logger.log(
                `Successfully processed ${expiredVendors.length} expired subscriptions.`,
            );
        } catch (error) {
            this.logger.error('Error processing expired subscriptions:', error);
        }
    }

    /**
     * Check for subscriptions expiring soon and send notifications.
     * Runs every day at 9 AM.
     */
    @Cron('0 9 * * *')
    async handleExpiringSubscriptionsNotifications() {
        this.logger.log('Checking for subscriptions expiring soon...');

        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        try {
            // Find vendors with subscriptions expiring in the next 3 days
            const expiringVendors = await this.prisma.vendor.findMany({
                where: {
                    subscriptionExpiryDate: {
                        gte: now,
                        lte: threeDaysFromNow,
                    },
                    subscriptionPlanId: {
                        not: null,
                    },
                },
                include: {
                    subscriptionPlan: true,
                },
            });

            if (expiringVendors.length === 0) {
                this.logger.log('No subscriptions expiring soon.');
                return;
            }

            this.logger.log(
                `Found ${expiringVendors.length} vendors with subscriptions expiring soon.`,
            );

            for (const vendor of expiringVendors) {
                const daysRemaining = Math.ceil(
                    (vendor.subscriptionExpiryDate!.getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24),
                );

                this.logger.log(
                    `Vendor ${vendor.title} subscription expires in ${daysRemaining} days.`,
                );

                // Send notification to vendor if 1, 2, or 3 days remaining
                if (daysRemaining >= 1 && daysRemaining <= 3) {
                    try {
                        // Get localized title and body
                        const titleEn = await this.i18n.translate('messages.SUBSCRIPTION_EXPIRING_TITLE', { lang: 'en' });
                        const titleAr = await this.i18n.translate('messages.SUBSCRIPTION_EXPIRING_TITLE', { lang: 'ar' });
                        const bodyEn = await this.i18n.translate('messages.SUBSCRIPTION_EXPIRING_BODY', {
                            lang: 'en',
                            args: { days: daysRemaining.toString() },
                        });
                        const bodyAr = await this.i18n.translate('messages.SUBSCRIPTION_EXPIRING_BODY', {
                            lang: 'ar',
                            args: { days: daysRemaining.toString() },
                        });

                        await this.notificationService.sendCustomNotification(
                            [vendor.authorId],
                            { en: titleEn, ar: titleAr },
                            { en: bodyEn, ar: bodyAr },
                            {
                                vendorId: vendor.id,
                                expiryDate: vendor.subscriptionExpiryDate,
                                daysRemaining: daysRemaining,
                                type: 'SUBSCRIPTION_EXPIRING',
                            }
                        );
                        this.logger.log(`Sent expiry notification to vendor ${vendor.id} (${daysRemaining} days left)`);
                    } catch (notifError) {
                        this.logger.error(`Failed to send expiry notification to vendor ${vendor.id}:`, notifError);
                    }
                }
            }
        } catch (error) {
            this.logger.error(
                'Error checking for expiring subscriptions:',
                error,
            );
        }
    }
}
