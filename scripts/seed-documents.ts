import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const documents = [
    {
        title: 'بطاقة الرقم القومي',
        type: 'driver',
        frontSide: true,
        backSide: true,
        expireAt: false,
        enable: true,
    },
    {
        title: 'رخصة القيادة',
        type: 'driver',
        frontSide: true,
        backSide: false,
        expireAt: false,
        enable: true,
    },
    {
        title: 'البطاقة الضريبية',
        type: 'vendor',
        frontSide: true,
        backSide: false,
        expireAt: false,
        enable: true,
    },
    {
        title: 'الرقم الضريبي',
        type: 'vendor',
        frontSide: true,
        backSide: false,
        expireAt: false,
        enable: true,
    },
];

async function seedDocuments() {
    console.log('Seeding documents...');

    for (const doc of documents) {
        await prisma.document.upsert({
            where: { title: doc.title },
            update: {
                type: doc.type,
                frontSide: doc.frontSide,
                backSide: doc.backSide,
                expireAt: doc.expireAt,
                enable: doc.enable,
            },
            create: doc,
        });
        console.log(`Added/updated document: ${doc.title} (${doc.type})`);
    }

    console.log('Documents seeded successfully!');
}

seedDocuments()
    .catch((e) => {
        console.error('Error seeding documents:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
