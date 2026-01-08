import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAppSettings() {

    const settings = [
        {
            key: 'story_enabled',
            value: 'true',
        },
        {
            key: 'google_play_link',
            value: '',
        },
        {
            key: 'app_store_link',
            value: '',
        },
        {
            key: 'website_url',
            value: '',
        },
        {
            key: 'fawaterak_enabled',
            value: 'true',
        },
        {
            key: 'wallet_enabled',
            value: 'true',
        },
        {
            key: 'cash_on_delivery_enabled',
            value: 'true',
        },
        {
            key: 'app_name',
            value: '',
        },
        {
            key: 'app_description',
            value: 'Food Delivery App',
        },
        {
            key: 'app_version',
            value: '',
        },
        {
            key: 'about_us',
            value: '',
        },
        {
            key: 'terms_and_conditions',
            value: '',
        },
        {
            key: 'privacy_policy',
            value: '',
        },
        {
            key: 'referral_enabled',
            value: 'true',
        },
        {
            key: 'referral_amount',
            value: '15',
        },
        {
            key: 'default_currency_code',
            value: 'ar',
        },
        {
            key: 'delivery_charge',
            value: '15',
        },
        {
            key: 'vendor_commission_rate',
            value: '10',
        },
        {
            key: 'driver_commission_rate',
            value: '15',
        },
        {
            key: 'contact_email',
            value: 'support@talqah.com',

        },
        {
            key: 'contact_phone',
            value: '',

        },
        {
            key: 'email_enabled',
            value: 'false',

        },
        {
            key: 'smtp_host',
            value: '',

        },
        {
            key: 'smtp_port',
            value: '587',
        },
        {
            key: 'smtp_username',
            value: '',
        },
        {
            key: 'smtp_password',
            value: '',
        },
        {
            key: 'email_from',
            value: 'noreply@talqah.com',
        },

        {
            key: 'sms_enabled',
            value: 'false',
        },
        {
            key: 'sms_provider',
            value: '',
        },
        {
            key: 'sms_api_key',
            value: '',
        },
        {
            key: 'min_order_amount',
            value: '0',
        },
        {
            key: 'max_order_amount',
            value: '10000',
        },
        {
            key: 'order_timeout_minutes',
            value: '30',
        },

    ];

    console.log('Adding app settings...');

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
        console.log(`Added/verified setting: ${setting.key}`);
    }

    console.log('All app settings added successfully!');
}

addAppSettings()
    .catch((e) => {
        console.error('Error adding app settings:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
