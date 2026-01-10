
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding zones...');

    const zones = [
        {
            arabicName: 'الرياض',
            englishName: 'Riyadh',
            latitude: 24.80144557303476,
            longitude: 46.832641590361135,
            isPublish: true,
            area: [
                { lat: 24.80144557303476, lng: 46.832641590361135 },
                { lat: 24.777507988191953, lng: 46.60828431429358 },
                { lat: 24.653757124797472, lng: 46.515901980536924 },
                { lat: 24.381873965305115, lng: 46.482908265936025 },
                { lat: 24.21766100724928, lng: 46.65447556507921 },
                { lat: 24.4238943421593, lng: 47.14498218927178 },
            ],
        },
        {
            arabicName: 'منطقه دكرنس',
            englishName: 'Dekernes',
            latitude: 31.16599549447945,
            longitude: 31.67635500690284,
            isPublish: true,
            area: [
                { lat: 31.16599549447945, lng: 31.67635500690284 },
                { lat: 31.158476968747774, lng: 31.513783599108184 },
                { lat: 31.06068123975535, lng: 31.45227003909586 },
                { lat: 30.957133825354394, lng: 31.52476815142388 },
                { lat: 30.966551878737853, lng: 31.61703832383145 },
                { lat: 31.013628193487364, lng: 31.68733955921854 },
                { lat: 31.073851934597254, lng: 31.72688401459946 },
            ],
        },
    ];

    for (const zone of zones) {
        const existing = await prisma.zone.findFirst({
            where: { englishName: zone.englishName },
        });

        if (existing) {
            await prisma.zone.update({
                where: { id: existing.id },
                data: {
                    arabicName: zone.arabicName,
                    latitude: zone.latitude,
                    longitude: zone.longitude,
                    isPublish: zone.isPublish,
                    area: zone.area,
                },
            });
            console.log(`Updated zone: ${zone.englishName}`);
        } else {
            await prisma.zone.create({
                data: {
                    // Let Prisma generate the UUID by default
                    arabicName: zone.arabicName,
                    englishName: zone.englishName,
                    latitude: zone.latitude,
                    longitude: zone.longitude,
                    isPublish: zone.isPublish,
                    area: zone.area,
                },
            });
            console.log(`Created zone: ${zone.englishName}`);
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
