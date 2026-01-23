import { DiscountType, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Egyptian vendors in Dekernes zone...');

    const zone = await prisma.zone.findFirst({
        where: { englishName: 'Dekernes' },
    });

    if (!zone) {
        console.error('Zone Dekernes not found. Please run seed-zones.ts first.');
        return;
    }

    const vendorType = await prisma.vendorType.findFirst({
        where: { englishName: 'Restaurants' },
    });

    if (!vendorType) {
        console.error('Vendor type Restaurants not found. Please run seed-vendor-type.ts first.');
        return;
    }

    const categories = await prisma.category.findMany();

    const egyptianVendors = [
        {
            title: 'كبدة البرنس',
            description: 'أشهر مأكولات شعبية مصرية - ناصر البرنس الأصلي',
            address: 'دكرنس - الشارع الرئيسي',
            email: 'prince@foodie.com',
            photo: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a6f8?q=80&w=500',
        },
        {
            title: 'صبحي كابر',
            description: 'ملك المشويات والطواجن المصرية بخلطته السرية',
            address: 'دكرنس - بجوار مجلس المدينة',
            email: 'kaber@foodie.com',
            photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=500',
        },
        {
            title: 'قصر الكبابجي',
            description: 'أفخم أنواع المشويات والكفتة المصرية الأصلية',
            address: 'دكرنس - طريق المنصورة',
            email: 'kababgi@foodie.com',
            photo: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=500',
        },
        {
            title: 'بيتزا باسطا',
            description: 'بيتزا إيطالية وفطائر شرقية بلمسة مصرية',
            address: 'دكرنس - شارع التحرير',
            email: 'pizza@foodie.com',
            photo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=500',
        },
        {
            title: 'بلب لبن',
            description: 'أشهر الحلويات الشرقية والأرز باللبن والقنبلة',
            address: 'دكرنس - منطقة المحطة',
            email: 'bellaban@foodie.com',
            photo: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=500',
        },
    ];

    const hashedPassword = await bcrypt.hash('password123', 10);

    for (const vData of egyptianVendors) {
        // 1. Create or Find User for vendor
        let user = await prisma.user.findUnique({ where: { email: vData.email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    firstName: vData.title.split(' ')[0],
                    lastName: vData.title.split(' ')[1] || 'Vendor',
                    email: vData.email,
                    password: hashedPassword,
                    role: UserRole.VENDOR,
                    zoneId: zone.id,
                    isActive: true,
                },
            });
        }

        // 2. Create Vendor
        const vendor = await prisma.vendor.upsert({
            where: { authorId: user.id },
            update: {
                title: vData.title,
                description: vData.description,
                address: vData.address,
                photo: vData.photo,
                latitude: zone.latitude || 31.1659,
                longitude: zone.longitude || 31.6763,
                zoneId: zone.id,
            },
            create: {
                authorId: user.id,
                title: vData.title,
                description: vData.description,
                address: vData.address,
                photo: vData.photo,
                logo: vData.photo,
                vendorTypeId: vendorType.id,
                latitude: zone.latitude || 31.1659,
                longitude: zone.longitude || 31.6763,
                zoneId: zone.id,
                isActive: true,
            },
        });

        console.log(`Processing vendor: ${vendor.title}`);

        // 3. Add 1 Product for every category
        for (const cat of categories) {
            const productName = `${cat.arabicName} من ${vendor.title}`;
            await prisma.product.create({
                data: {
                    name: productName,
                    description: `وصف لذيذ لـ ${productName} - جودة ممتازة وسعر مناسب`,
                    price: 50 + Math.floor(Math.random() * 200),
                    discountPrice: 40 + Math.floor(Math.random() * 150),
                    image: vData.photo,
                    categoryId: cat.id,
                    vendorId: vendor.id,
                    isActive: true,
                    isPublish: true,
                },
            });
        }

        // 4. Add 1 Discount (SpecialDiscount)
        await prisma.specialDiscount.create({
            data: {
                vendorId: vendor.id,
                discount: 25,
                discountType: DiscountType.PERCENTAGE,
                couponCode: `SAVE25_${vendor.id.substring(0, 4)}`,
                photo: vData.photo,
                endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
                isPublish: true,
                isActive: true,
            },
        });

        // 5. Add 1 Coupon
        await prisma.coupon.create({
            data: {
                code: `WELCOME_${vendor.id.substring(0, 4)}`,
                name: `خصم ترحيبي من ${vendor.title}`,
                discount: "20",
                discountType: 'percentage',
                maxDiscount: 50,
                minOrderAmount: 100,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 days
                vendorId: vendor.id,
                isPublic: true,
                isActive: true,
            },
        });

        // 6. Add 1 Story
        await prisma.story.create({
            data: {
                vendorId: vendor.id,
                mediaUrl: vData.photo,
                duration: 15,
                mediaType: 'image',
                isActive: true,
            },
        });
    }

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
