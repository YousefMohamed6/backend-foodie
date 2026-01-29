import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const managers = await prisma.user.findMany({
        where: { role: UserRole.MANAGER },
        select: {
            firstName: true,
            lastName: true,
            phoneNumber: true,
            countryCode: true,
        }
    });
    console.log(JSON.stringify(managers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
