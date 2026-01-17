import { PrismaClient } from '@prisma/client';
import { ORDERS_NOTIFICATIONS } from '../src/modules/orders/orders.constants';
import { SUBSCRIPTIONS_NOTIFICATIONS } from '../src/modules/subscriptions/subscriptions.constants';

const prisma = new PrismaClient();

interface NotificationTemplate {
    en: {
        subject: string;
        message: string;
    };
    ar: {
        subject: string;
        message: string;
    };
}

async function seedNotificationTemplates() {
    console.log('Seeding notification templates...');

    const templates: Record<string, NotificationTemplate> = {
        [ORDERS_NOTIFICATIONS.ORDER_PLACED]: {
            en: {
                subject: 'New Order Received',
                message: 'You have received a new order. Please review and accept it.',
            },
            ar: {
                subject: 'تم استلام طلب جديد',
                message: 'لقد تلقيت طلبًا جديدًا. يرجى المراجعة والقبول.',
            },
        },
        [ORDERS_NOTIFICATIONS.ORDER_ACCEPTED]: {
            en: {
                subject: 'Order Accepted',
                message: 'Your order has been accepted and is being prepared.',
            },
            ar: {
                subject: 'تم قبول الطلب',
                message: 'تم قبول طلبك وجاري تحضيره.',
            },
        },
        [ORDERS_NOTIFICATIONS.ORDER_REJECTED]: {
            en: {
                subject: 'Order Rejected',
                message: 'Unfortunately, your order could not be accepted at this time.',
            },
            ar: {
                subject: 'تم رفض الطلب',
                message: 'للأسف، لا يمكن قبول طلبك في هذا الوقت.',
            },
        },
        [ORDERS_NOTIFICATIONS.ORDER_CANCELLED]: {
            en: {
                subject: 'Order Cancelled',
                message: 'Your order has been cancelled.',
            },
            ar: {
                subject: 'تم إلغاء الطلب',
                message: 'تم إلغاء طلبك.',
            },
        },
        [ORDERS_NOTIFICATIONS.ORDER_DRIVER_PENDING]: {
            en: {
                subject: 'Finding Driver',
                message: 'We are finding a driver for your order.',
            },
            ar: {
                subject: 'البحث عن سائق',
                message: 'نحن نبحث عن سائق لطلبك.',
            },
        },
        [ORDERS_NOTIFICATIONS.ORDER_DRIVER_ACCEPTED]: {
            en: {
                subject: 'Driver Assigned',
                message: 'A driver has been assigned and is on the way to pick up your order.',
            },
            ar: {
                subject: 'تم تعيين سائق',
                message: 'تم تعيين سائق وهو في الطريق لاستلام طلبك.',
            },
        },
        [ORDERS_NOTIFICATIONS.ORDER_SHIPPED]: {
            en: {
                subject: 'Order Picked Up',
                message: 'Your order has been picked up and is on the way to you.',
            },
            ar: {
                subject: 'تم استلام الطلب',
                message: 'تم استلام طلبك وهو في الطريق إليك.',
            },
        },
        [ORDERS_NOTIFICATIONS.ORDER_IN_TRANSIT]: {
            en: {
                subject: 'Order In Transit',
                message: 'Your order is currently being delivered.',
            },
            ar: {
                subject: 'الطلب في الطريق',
                message: 'طلبك قيد التوصيل حاليًا.',
            },
        },
        [ORDERS_NOTIFICATIONS.ORDER_COMPLETED]: {
            en: {
                subject: 'Order Delivered',
                message: 'Your order has been delivered. Enjoy your meal!',
            },
            ar: {
                subject: 'تم توصيل الطلب',
                message: 'تم توصيل طلبك. استمتع بوجبتك!',
            },
        },
        [ORDERS_NOTIFICATIONS.ORDER_READY]: {
            en: {
                subject: 'Order Ready!',
                message: 'Your order from {vendorName} is ready.',
            },
            ar: {
                subject: 'الطلب جاهز!',
                message: 'طلبك من {vendorName} جاهز.',
            },
        },
        [ORDERS_NOTIFICATIONS.MANAGER_ORDER_READY]: {
            en: {
                subject: 'Order Ready',
                message: 'Order #{orderId} from {vendorName} is prepared and ready for delivery.',
            },
            ar: {
                subject: 'الطلب جاهز',
                message: 'الطلب #{orderId} من {vendorName} تم تحضيره وجاهز للتوصيل.',
            },
        },
        [ORDERS_NOTIFICATIONS.MANAGER_DRIVER_ACCEPTED]: {
            en: {
                subject: 'Driver Accepted Order',
                message: 'Driver {driverName} has accepted order #{orderId} from {vendorName}.',
            },
            ar: {
                subject: 'تم قبول الطلب من السائق',
                message: 'السائق {driverName} قبل الطلب #{orderId} من {vendorName}.',
            },
        },
        [ORDERS_NOTIFICATIONS.MANAGER_DRIVER_REJECTED]: {
            en: {
                subject: 'Driver Rejected Order',
                message: 'Driver {driverName} has rejected order #{orderId} from {vendorName}. Please reassign.',
            },
            ar: {
                subject: 'تم رفض الطلب من السائق',
                message: 'السائق {driverName} رفض الطلب #{orderId} من {vendorName}. يرجى إعادة التعيين.',
            },
        },
        [SUBSCRIPTIONS_NOTIFICATIONS.SUBSCRIPTION_EXPIRING_SOON]: {
            en: {
                subject: 'Subscription Expiring Soon',
                message: 'Your subscription is expiring soon. Please renew to avoid interruption.',
            },
            ar: {
                subject: 'اشتراكك ينتهي قريباً',
                message: 'اشتراكك ينتهي قريباً. يرجى التجديد لتجنب الانقطاع.',
            },
        },
    };

    let addedCount = 0;
    let updatedCount = 0;

    for (const [key, template] of Object.entries(templates)) {
        try {
            const existing = await prisma.notificationTemplate.findUnique({
                where: { key },
            });

            const data = {
                key,
                subjectEn: template.en.subject,
                subjectAr: template.ar.subject,
                bodyEn: template.en.message,
                bodyAr: template.ar.message,
            };

            if (existing) {
                await prisma.notificationTemplate.update({
                    where: { key },
                    data,
                });
                console.log(`✓ Updated template: ${key}`);
                updatedCount++;
            } else {
                await prisma.notificationTemplate.create({
                    data,
                });
                console.log(`✓ Added template: ${key}`);
                addedCount++;
            }

            // Cleanup from settings table if exists
            const oldSetting = await prisma.setting.findUnique({ where: { key } });
            if (oldSetting) {
                await prisma.setting.delete({ where: { key } });
                console.log(`  - Cleaned up old setting: ${key}`);
            }
        } catch (error) {
            console.error(`✗ Error processing template ${key}:`, error);
        }
    }

    console.log(`\n✅ Notification templates seeding completed!`);
    console.log(`   - Added: ${addedCount} templates`);
    console.log(`   - Updated: ${updatedCount} templates`);
    console.log(`   - Total: ${Object.keys(templates).length} templates\n`);
}

seedNotificationTemplates()
    .catch((error) => {
        console.error('Error seeding notification templates:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
