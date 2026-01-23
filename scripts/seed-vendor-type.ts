import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding vendor types...');

    const vendorTypes = [
        {
            englishName: 'Health',
            arabicName: 'الصحة',
            photo: 'https://firebasestorage.googleapis.com/v0/b/tal2a-427ac.firebasestorage.app/o/categories%2Fhealth.png?alt=media&token=81579955-2a02-4670-b2f4-13fb40b7ae8c',
            isActive: true,
            showOnHome: true,
        },
        {
            englishName: 'Restaurants',
            arabicName: 'مطاعم',
            photo: 'https://firebasestorage.googleapis.com/v0/b/tal2a-427ac.firebasestorage.app/o/categories%2Frestaurants.png?alt=media&token=f443a0f1-d228-47fa-bfe3-e2196a1dfe8e',
            isActive: true,
            showOnHome: true,
        },
        {
            englishName: 'Desserts',
            arabicName: 'حلويات',
            photo: 'https://firebasestorage.googleapis.com/v0/b/tal2a-427ac.firebasestorage.app/o/categories%2Fdesserts.png?alt=media&token=718e5746-530d-4f2e-9315-f71ba2aa5114',
            isActive: true,
            showOnHome: true,
        },
        {
            englishName: 'Beverages',
            arabicName: 'مشروبات',
            photo: 'https://firebasestorage.googleapis.com/v0/b/tal2a-427ac.firebasestorage.app/o/categories%2Fbeverages.png?alt=media&token=eb57daae-be59-49b4-840d-fd34d7b5cd9e',
            isActive: true,
            showOnHome: true,
        },
        {
            englishName: 'Brands',
            arabicName: 'ماركات',
            photo: 'https://firebasestorage.googleapis.com/v0/b/tal2a-427ac.firebasestorage.app/o/categories%2Fbrands.png?alt=media&token=40175637-8e35-4033-933a-9c1288e85234',
            isActive: true,
            showOnHome: true,
        },
        {
            englishName: 'Rose',
            arabicName: 'ورد',
            photo: 'https://firebasestorage.googleapis.com/v0/b/tal2a-427ac.firebasestorage.app/o/categories%2Frose.png?alt=media&token=3c28a4e9-386c-451a-8d2b-fda004cff5ce',
            isActive: true,
            showOnHome: true,
        },
        {
            englishName: 'Beauty',
            arabicName: 'تجميل',
            photo: 'https://firebasestorage.googleapis.com/v0/b/tal2a-427ac.firebasestorage.app/o/categories%2Fbeauty.png?alt=media&token=bd4d946d-2459-4013-beba-918534d52ecb',
            isActive: true,
            showOnHome: true,
        },
    ];

    let created = 0;
    let updated = 0;

    for (const vendorType of vendorTypes) {
        const existing = await prisma.vendorType.findFirst({
            where: { englishName: vendorType.englishName },
        });

        if (existing) {
            await prisma.vendorType.update({
                where: { id: existing.id },
                data: {
                    englishName: vendorType.englishName,
                    arabicName: vendorType.arabicName,
                    photo: vendorType.photo,
                    isActive: vendorType.isActive,
                    showOnHome: vendorType.showOnHome,
                },
            });
            console.log(`✓ Updated vendor type: ${vendorType.englishName} (${vendorType.arabicName})`);
            updated++;
        } else {
            await prisma.vendorType.create({
                data: {
                    englishName: vendorType.englishName,
                    arabicName: vendorType.arabicName,
                    photo: vendorType.photo,
                    isActive: vendorType.isActive,
                    showOnHome: vendorType.showOnHome,
                },
            });
            console.log(`✓ Created vendor type: ${vendorType.englishName} (${vendorType.arabicName})`);
            created++;
        }
    }

    console.log(`\n✅ Vendor types seeding completed!`);
    console.log(`   - Created: ${created} vendor types`);
    console.log(`   - Updated: ${updated} vendor types`);
    console.log(`   - Total: ${vendorTypes.length} vendor types`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
