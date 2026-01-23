import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding vendor categories...');

    const categories = [
        {
            englishName: 'Fast Food',
            arabicName: 'وجبات سريعة',
            descriptionEn: 'Quick and delicious fast food options',
            descriptionAr: 'خيارات وجبات سريعة ولذيذة',
            image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=2070&auto=format&fit=crop',
            isActive: true,
            showOnHome: true,
        },
        {
            englishName: 'Pizza',
            arabicName: 'بيتزا',
            descriptionEn: 'Authentic and creative pizza varieties',
            descriptionAr: 'أنواع بيتزا أصلية ومبتكرة',
            image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=2070&auto=format&fit=crop',
            isActive: true,
            showOnHome: true,
        },
        {
            englishName: 'Burgers',
            arabicName: 'برجر',
            descriptionEn: 'Juicy burgers and sandwiches',
            descriptionAr: 'برجر وساندويتشات شهية',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1998&auto=format&fit=crop',
            isActive: true,
            showOnHome: true,
        },
        {
            englishName: 'Desserts',
            arabicName: 'حلويات',
            descriptionEn: 'Sweet treats and desserts',
            descriptionAr: 'حلويات ومأكولات حلوة',
            image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=1964&auto=format&fit=crop',
            isActive: true,
            showOnHome: true,
        },
        {
            englishName: 'Grills',
            arabicName: 'مشويات',
            descriptionEn: 'Fresh grilled meats and kebabs',
            descriptionAr: 'لحوم مشوية طازجة وكباب',
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop',
            isActive: true,
            showOnHome: true,
        },
    ];

    let created = 0;
    let updated = 0;

    for (const category of categories) {
        const existing = await prisma.category.findFirst({
            where: { englishName: category.englishName },
        });

        if (existing) {
            await prisma.category.update({
                where: { id: existing.id },
                data: {
                    englishName: category.englishName,
                    arabicName: category.arabicName,
                    description: category.descriptionEn,
                    descriptionAr: category.descriptionAr,
                    image: category.image,
                    isActive: category.isActive,
                    showOnHome: category.showOnHome,
                },
            });
            console.log(`✓ Updated category: ${category.englishName} (${category.arabicName})`);
            updated++;
        } else {
            await prisma.category.create({
                data: {
                    englishName: category.englishName,
                    arabicName: category.arabicName,
                    description: category.descriptionEn,
                    descriptionAr: category.descriptionAr,
                    image: category.image,
                    isActive: category.isActive,
                    showOnHome: category.showOnHome,
                },
            });
            console.log(`✓ Created category: ${category.englishName} (${category.arabicName})`);
            created++;
        }
    }

    console.log(`\n✅ Vendor categories seeding completed!`);
    console.log(`   - Created: ${created} categories`);
    console.log(`   - Updated: ${updated} categories`);
    console.log(`   - Total: ${categories.length} categories`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
