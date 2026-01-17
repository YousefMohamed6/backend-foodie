import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding vendor types...');

  const count = await prisma.vendorType.count();
  if (count > 0) {
    console.log('Vendor types already exist. Skipping.');
    return;
  }

  const vendorTypes = [
    { englishName: 'Restaurant', arabicName: 'مطعم' },
    { englishName: 'Cafe', arabicName: 'كافيه' },
    { englishName: 'Grocery', arabicName: 'بقالة' },
    { englishName: 'Pharmacy', arabicName: 'صيدلية' },
  ];

  await prisma.vendorType.createMany({ data: vendorTypes });
  console.log(`Successfully seeded ${vendorTypes.length} vendor types.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
