import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGetOrders() {
    const driverId = 'c4b2d9c3-60d0-4cd2-a9f3-e2f1b4b9c1f1';

    const orders = await prisma.order.findMany({
        where: { driverId: driverId },
        include: {
            vendor: true,
            author: true,
            items: true,
        }
    });

    console.log(`Found ${orders.length} orders directly in DB for driver ${driverId}`);
    orders.forEach(o => console.log(`- Order: ${o.id}, Status: ${o.status}`));
}

testGetOrders()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
