import { PrismaClient } from '@prisma/client';

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
        notification_template_order_placed: {
            en: {
                subject: 'New Order Received',
                message: 'You have received a new order. Please review and accept it.',
            },
            ar: {
                subject: 'تم استلام طلب جديد',
                message: 'لقد تلقيت طلبًا جديدًا. يرجى المراجعة والقبول.',
            },
        },
        notification_template_order_accepted: {
            en: {
                subject: 'Order Accepted',
                message: 'Your order has been accepted and is being prepared.',
            },
            ar: {
                subject: 'تم قبول الطلب',
                message: 'تم قبول طلبك وجاري تحضيره.',
            },
        },
        notification_template_order_rejected: {
            en: {
                subject: 'Order Rejected',
                message: 'Unfortunately, your order could not be accepted at this time.',
            },
            ar: {
                subject: 'تم رفض الطلب',
                message: 'للأسف، لا يمكن قبول طلبك في هذا الوقت.',
            },
        },
        notification_template_order_cancelled: {
            en: {
                subject: 'Order Cancelled',
                message: 'Your order has been cancelled.',
            },
            ar: {
                subject: 'تم إلغاء الطلب',
                message: 'تم إلغاء طلبك.',
            },
        },
        notification_template_order_driver_pending: {
            en: {
                subject: 'Finding Driver',
                message: 'We are finding a driver for your order.',
            },
            ar: {
                subject: 'البحث عن سائق',
                message: 'نحن نبحث عن سائق لطلبك.',
            },
        },
        notification_template_order_driver_accepted: {
            en: {
                subject: 'Driver Assigned',
                message: 'A driver has been assigned and is on the way to pick up your order.',
            },
            ar: {
                subject: 'تم تعيين سائق',
                message: 'تم تعيين سائق وهو في الطريق لاستلام طلبك.',
            },
        },
        notification_template_order_shipped: {
            en: {
                subject: 'Order Picked Up',
                message: 'Your order has been picked up and is on the way to you.',
            },
            ar: {
                subject: 'تم استلام الطلب',
                message: 'تم استلام طلبك وهو في الطريق إليك.',
            },
        },
        notification_template_order_in_transit: {
            en: {
                subject: 'Order In Transit',
                message: 'Your order is currently being delivered.',
            },
            ar: {
                subject: 'الطلب في الطريق',
                message: 'طلبك قيد التوصيل حاليًا.',
            },
        },
        notification_template_order_completed: {
            en: {
                subject: 'Order Delivered',
                message: 'Your order has been delivered. Enjoy your meal!',
            },
            ar: {
                subject: 'تم توصيل الطلب',
                message: 'تم توصيل طلبك. استمتع بوجبتك!',
            },
        },
    };

    let addedCount = 0;
    let updatedCount = 0;

    for (const [key, template] of Object.entries(templates)) {
        try {
            const existing = await prisma.setting.findUnique({
                where: { key },
            });

            const value = JSON.stringify(template);

            if (existing) {
                await prisma.setting.update({
                    where: { key },
                    data: { value },
                });
                console.log(`✓ Updated template: ${key}`);
                updatedCount++;
            } else {
                await prisma.setting.create({
                    data: {
                        key,
                        value,
                    },
                });
                console.log(`✓ Added template: ${key}`);
                addedCount++;
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
