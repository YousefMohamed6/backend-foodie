import { DiscountType, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating Egyptian vendors in Dekernes zone...');

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
    const weekDays = await prisma.weekDay.findMany();
    const freePlan = await prisma.subscriptionPlan.findFirst({
        where: { englishName: 'Basic Plan' },
    });

    if (!freePlan) {
        console.error('Basic Plan not found. Please run seed-subscription-plans.ts first.');
        return;
    }

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

    const categoryImages: Record<string, string[]> = {
        'Fast Food': [
            'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=600',
            'https://images.unsplash.com/photo-1563379091339-03b21bc4a6f8?q=80&w=600',
            'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=600',
            'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=600',
        ],
        'Pizza': [
            'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600',
            'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=600',
            'https://images.unsplash.com/photo-1574123853664-6ec568858348?q=80&w=600',
            'https://images.unsplash.com/photo-1571997478779-2adcbbe9bb2f?q=80&w=600',
        ],
        'Burgers': [
            'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600',
            'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=600',
            'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600',
        ],
        'Desserts': [
            'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=600',
            'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=600',
            'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=600',
            'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=600',
        ],
        'Grills': [
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600',
            'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600',
            'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=600',
            'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=600',
        ]
    };

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
                    subscriptionPlanId: freePlan.id,
                    subscriptionExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
                },
            });
        } else {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    subscriptionPlanId: freePlan.id,
                    subscriptionExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
                }
            });
        }

        // 2. Create/Update Vendor
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
                subscriptionPlanId: freePlan.id,
                subscriptionExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
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
                subscriptionPlanId: freePlan.id,
                subscriptionExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
            },
        });

        // 2.a Create a Subscription record
        await prisma.subscription.upsert({
            where: { id: `sub_${vendor.id}` }, // Generate a consistent ID for seeding
            update: {
                status: 'ACTIVE',
                endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            },
            create: {
                id: `sub_${vendor.id}`,
                userId: user.id,
                planId: freePlan.id,
                startDate: new Date(),
                endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
                status: 'ACTIVE',
                amountPaid: 0,
                paymentMethod: 'system',
                vendors: { connect: { id: vendor.id } }
            }
        });

        // 2.b Add Vendor Schedule for all days
        await prisma.vendorSchedule.deleteMany({ where: { vendorId: vendor.id } });
        for (const day of weekDays) {
            await prisma.vendorSchedule.create({
                data: {
                    vendorId: vendor.id,
                    dayId: day.id,
                    openTime: '00:00',
                    closeTime: '23:59',
                    isActive: true,
                }
            });
        }

        console.log(`Processing vendor: ${vendor.title}`);

        // 3. Add or Update Product for every category
        for (const cat of categories) {
            const productName = `${cat.arabicName} من ${vendor.title}`;

            // Randomize quantity: -1 (unlimited) or 10-100
            const randomQty = Math.random() > 0.3 ? -1 : 10 + Math.floor(Math.random() * 91);

            // Get a random real image for this category
            const images = categoryImages[cat.englishName || 'Fast Food'] || categoryImages['Fast Food'];
            const randomImage = images[Math.floor(Math.random() * images.length)];

            const existingProduct = await prisma.product.findFirst({
                where: {
                    name: productName,
                    vendorId: vendor.id,
                },
            });

            if (existingProduct) {
                const price = 100 + Math.floor(Math.random() * 200);
                const discountPrice = Math.floor(price * 0.7); // 30% discount
                await prisma.product.update({
                    where: { id: existingProduct.id },
                    data: {
                        image: randomImage,
                        price: price,
                        discountPrice: discountPrice,
                        quantity: randomQty,
                        isActive: true,
                        isPublish: true,
                    },
                });
            } else {
                const price = 100 + Math.floor(Math.random() * 200);
                const discountPrice = Math.floor(price * 0.7); // 30% discount
                await prisma.product.create({
                    data: {
                        name: productName,
                        description: `وصف لذيذ لـ ${productName} - جودة ممتازة وسعر مناسب`,
                        price: price,
                        discountPrice: discountPrice,
                        image: randomImage,
                        quantity: randomQty,
                        categoryId: cat.id,
                        vendorId: vendor.id,
                        isActive: true,
                        isPublish: true,
                    },
                });
            }
        }

        // 4. Upsert Discount (SpecialDiscount)
        const existingDiscount = await prisma.specialDiscount.findFirst({
            where: { vendorId: vendor.id }
        });

        if (existingDiscount) {
            await prisma.specialDiscount.update({
                where: { id: existingDiscount.id },
                data: {
                    photo: vData.photo,
                    isPublish: true,
                    isActive: true,
                }
            });
        } else {
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
        }

        // 5. Upsert Coupon
        const couponCode = `WELCOME_${vendor.id.substring(0, 4)}`;
        await prisma.coupon.upsert({
            where: { code: couponCode },
            update: {
                isActive: true,
                isPublic: true,
            },
            create: {
                code: couponCode,
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

        // 6. Add/Update Stories (mix of videos and images)
        // Using reliable sample video sources
        const storyMedia = [
            {
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                type: 'video',
                duration: 15,
            },
            {
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                type: 'video',
                duration: 12,
            },
            {
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                type: 'video',
                duration: 10,
            },
            {
                url: vData.photo,
                type: 'image',
                duration: 5,
            },
        ];

        // Delete existing stories for this vendor
        await prisma.story.deleteMany({
            where: { vendorId: vendor.id }
        });

        // Create new stories with real videos
        for (let i = 0; i < storyMedia.length; i++) {
            const media = storyMedia[i];
            await prisma.story.create({
                data: {
                    vendorId: vendor.id,
                    mediaUrl: media.url,
                    duration: media.duration,
                    mediaType: media.type,
                    isActive: true,
                },
            });
        }
        console.log(`Added ${storyMedia.length} stories for ${vendor.title}`);
    }

    console.log('Update completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
