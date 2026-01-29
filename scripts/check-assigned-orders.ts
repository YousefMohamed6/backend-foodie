import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrders() {
    const orders = await prisma.order.findMany({
        where: {
            driverId: { not: null },
        },
        include: {
            driver: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                }
            }
        }
    });

    console.log('--- Orders with Assigned Drivers ---');
    orders.forEach(o => {
        console.log(`Order ID: ${o.id}, Status: ${o.status}, Driver ID: ${o.driverId}, Driver Email: ${o.driver?.email}, Role: ${o.driver?.role}`);
    });
    console.log('-----------------------------------');
}

checkOrders()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
