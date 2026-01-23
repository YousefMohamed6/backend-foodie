import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding banners...');

    const banners = [
        // Top Position Banners
        {
            title: 'Gourmet Pizza Offer',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop',
            position: 'top',
            redirectType: 'store',
            redirectId: 'crS1b1NRzx4ti27SdWhm',
            order: 1,
            isActive: true,
        },
        {
            title: 'Juicy Burgers Special',
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1965&auto=format&fit=crop',
            position: 'top',
            redirectType: 'store',
            redirectId: 'cRNhOZaSgmzdKl5wi5AO',
            order: 2,
            isActive: true,
        },
        // Middle Position Banners
        {
            title: 'Fresh Sushi Delivery',
            image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop',
            position: 'middle',
            redirectType: 'store',
            redirectId: 'cRNhOZaSgmzdKl5wi5AO',
            order: 1,
            isActive: true,
        },
        {
            title: 'Summer Ice Cream',
            image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=2070&auto=format&fit=crop',
            position: 'middle',
            redirectType: 'product',
            redirectId: '668e3d858277a',
            order: 2,
            isActive: true,
        },
        {
            title: 'Healthy Bowls',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
            position: 'middle',
            redirectType: 'external_link',
            redirectId: 'https://yourdomain.com',
            order: 3,
            isActive: true,
        },
    ];

    for (const banner of banners) {
        const existing = await prisma.banner.findFirst({
            where: { title: banner.title },
        });

        if (existing) {
            await prisma.banner.update({
                where: { id: existing.id },
                data: {
                    image: banner.image,
                    position: banner.position,
                    redirectType: banner.redirectType,
                    redirectId: banner.redirectId,
                    order: banner.order,
                    isActive: banner.isActive,
                },
            });
            console.log(`Updated banner: ${banner.title}`);
        } else {
            await prisma.banner.create({
                data: {
                    // Let Prisma generate the UUID by default
                    title: banner.title,
                    image: banner.image,
                    position: banner.position,
                    redirectType: banner.redirectType,
                    redirectId: banner.redirectId,
                    order: banner.order,
                    isActive: banner.isActive,
                },
            });
            console.log(`Created banner: ${banner.title}`);
        }
    }

    console.log('Banner seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
