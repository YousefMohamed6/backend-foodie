import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllOrders() {
    const orders = await prisma.order.findMany({
        include: {
            driver: {
                select: {
                    id: true,
                    email: true,
                }
            }
        }
    });

    console.log('--- All Orders ---');
    orders.forEach(o => {
        console.log(`Order ID: ${o.id}, Status: ${o.status}, Driver ID: ${o.driverId}, Driver Email: ${o.driver?.email}`);
    });
    console.log('------------------');
}

checkAllOrders()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
