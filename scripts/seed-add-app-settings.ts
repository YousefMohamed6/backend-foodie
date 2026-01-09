import { PrismaClient } from '@prisma/client';
import { DEFAULT_APP_SETTINGS } from '../src/modules/settings/settings.constants';

const prisma = new PrismaClient();

async function addAppSettings() {
    console.log('Adding app settings...');

    const settings = Object.entries(DEFAULT_APP_SETTINGS).map(([key, value]) => ({
        key,
        value,
    }));

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
