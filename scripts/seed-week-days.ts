import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const days = [
        { id: 0, nameEn: 'Sunday', nameAr: 'الأحد' },
        { id: 1, nameEn: 'Monday', nameAr: 'الاثنين' },
        { id: 2, nameEn: 'Tuesday', nameAr: 'الثلاثاء' },
        { id: 3, nameEn: 'Wednesday', nameAr: 'الأربعاء' },
        { id: 4, nameEn: 'Thursday', nameAr: 'الخميس' },
        { id: 5, nameEn: 'Friday', nameAr: 'الجمعة' },
        { id: 6, nameEn: 'Saturday', nameAr: 'السبت' },
    ];

    for (const day of days) {
        await prisma.weekDay.upsert({
            where: { id: day.id },
            update: day,
            create: day,
        });
    }

    console.log('Week days seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
