import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding managers for Marsoul feature...');

    const zones = await prisma.zone.findMany();
    if (zones.length === 0) {
        console.error('No zones found. Please run seed-zones.ts first.');
        return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    const managers = [
        {
            firstName: 'Ahmed',
            lastName: 'Mandoob',
            email: 'ahmed.mandoob@foodie.com',
            countryCode: '+20',
            phoneNumber: '1012345678',
            zoneName: 'Dekernes',
        },
        {
            firstName: 'Mohamed',
            lastName: 'Marsoul',
            email: 'mohamed.marsoul@foodie.com',
            countryCode: '+20',
            phoneNumber: '1112345678',
            zoneName: 'Dekernes',
        },
        {
            firstName: 'Salih',
            lastName: 'Riyadh',
            email: 'salih.riyadh@foodie.com',
            countryCode: '+966',
            phoneNumber: '501234567',
            zoneName: 'Riyadh',
        },
    ];

    for (const mData of managers) {
        const zone = zones.find(z => z.englishName === mData.zoneName);
        if (!zone) {
            console.warn(`Zone ${mData.zoneName} not found, skipping manager ${mData.firstName}`);
            continue;
        }

        await prisma.user.upsert({
            where: { email: mData.email },
            update: {
                firstName: mData.firstName,
                lastName: mData.lastName,
                phoneNumber: mData.phoneNumber,
                countryCode: mData.countryCode,
                role: UserRole.MANAGER,
                zoneId: zone.id,
                isActive: true,
            },
            create: {
                firstName: mData.firstName,
                lastName: mData.lastName,
                email: mData.email,
                password: hashedPassword,
                phoneNumber: mData.phoneNumber,
                countryCode: mData.countryCode,
                role: UserRole.MANAGER,
                zoneId: zone.id,
                isActive: true,
            },
        });
        console.log(`Upserted manager: ${mData.firstName} ${mData.lastName} in ${mData.zoneName}`);
    }

    console.log('Manager seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
