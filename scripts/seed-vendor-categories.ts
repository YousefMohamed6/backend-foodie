import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding vendor categories...');

    const categories = [
        {
            name: 'Fast Food',
            nameAr: 'وجبات سريعة',
            description: 'Quick and delicious fast food options',
            descriptionAr: 'خيارات وجبات سريعة ولذيذة',
            isActive: true,
            showOnHome: true,
        },
        {
            name: 'Pizza',
            nameAr: 'بيتزا',
            description: 'Authentic and creative pizza varieties',
            descriptionAr: 'أنواع بيتزا أصلية ومبتكرة',
            isActive: true,
            showOnHome: true,
        },
        {
            name: 'Burgers',
            nameAr: 'برجر',
            description: 'Juicy burgers and sandwiches',
            descriptionAr: 'برجر وساندويتشات شهية',
            isActive: true,
            showOnHome: true,
        },
        {
            name: 'Desserts',
            nameAr: 'حلويات',
            description: 'Sweet treats and desserts',
            descriptionAr: 'حلويات ومأكولات حلوة',
            isActive: true,
            showOnHome: true,
        },
        {
            name: 'Grills',
            nameAr: 'مشويات',
            description: 'Fresh grilled meats and kebabs',
            descriptionAr: 'لحوم مشوية طازجة وكباب',
            isActive: true,
            showOnHome: true,
        },
    ];

    let created = 0;
    let updated = 0;

    for (const category of categories) {
        const existing = await prisma.category.findFirst({
            where: { name: category.name },
        });

        if (existing) {
            await prisma.category.update({
                where: { id: existing.id },
                data: {
                    englishName: category.name,
                    arabicName: category.nameAr,
                    description: category.description,
                    descriptionAr: category.descriptionAr,
                    isActive: category.isActive,
                    showOnHome: category.showOnHome,
                },
            });
            console.log(`✓ Updated category: ${category.name} (${category.nameAr})`);
            updated++;
        } else {
            await prisma.category.create({
                data: {
                    name: category.name,
                    englishName: category.name,
                    arabicName: category.nameAr,
                    description: category.description,
                    descriptionAr: category.descriptionAr,
                    isActive: category.isActive,
                    showOnHome: category.showOnHome,
                },
            });
            console.log(`✓ Created category: ${category.name} (${category.nameAr})`);
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
