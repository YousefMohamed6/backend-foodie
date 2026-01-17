import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding subscription plans with localized names and features...');

    // Clear existing dependencies to allow fresh seeding
    try {
        console.log('Clearing existing dependencies (Subscriptions, User/Vendor plan associations)...');
        await prisma.subscription.deleteMany({});
        await prisma.user.updateMany({
            where: { NOT: { subscriptionPlanId: null } },
            data: { subscriptionPlanId: null }
        });
        await prisma.vendor.updateMany({
            where: { NOT: { subscriptionPlanId: null } },
            data: { subscriptionPlanId: null }
        });

        await prisma.subscriptionFeature.deleteMany({});
        await prisma.subscriptionPlan.deleteMany({});
        console.log('Cleared existing plans, features, and associations.');
    } catch (error) {
        console.error('Error clearing existing data:', error);
    }

    const allFeatures = ["chat", "dineIn", "qrCodeGenerate", "restaurantMobileApp"];

    const plans = [
        {
            arabicName: "الخطة الذهبية",
            englishName: "Gold Plan",
            description: "Gold Plan",
            price: 1200,
            durationDays: 30,
            totalOrders: -1,
            productsLimit: -1,
            place: "3",
            image: "https://firebasestorage.googleapis.com/v0/b/foodies-3c1d9.appspot.com/o/images%2Fpro_1736494455975.png?alt=media&token=f303c2d0-bae8-40e7-8d6f-6b20b3129ec5",
            type: "paid",
            planPoints: ["طلبات غير محدودة", "منتجات غير محدودة", "صلاحية 30 يوم"],
            isActive: true,
            features: allFeatures.map(f => ({ key: f, value: true }))
        },
        {
            arabicName: "الخطة البرونزية",
            englishName: "Bronze Plan",
            description: "الخطة البرونزية",
            price: 400,
            durationDays: 30,
            totalOrders: 50,
            productsLimit: 10,
            place: "1",
            image: "https://firebasestorage.googleapis.com/v0/b/foodies-3c1d9.appspot.com/o/images%2Fbasic_1736493305812.png?alt=media&token=e3acc1c0-4277-410f-aca9-c39beff9b0c4",
            type: "paid",
            planPoints: ["حد أقصى 50 طلب", "حد أقصى 10 منتجات", "صلاحية 30 يوم"],
            isActive: true,
            features: allFeatures.map(f => ({ key: f, value: true }))
        },
        {
            arabicName: "الخطة الفضية",
            englishName: "Silver Plan",
            description: "Silver Plan",
            price: 750,
            durationDays: 30,
            totalOrders: 100,
            productsLimit: 20,
            place: "2",
            image: "https://firebasestorage.googleapis.com/v0/b/foodies-3c1d9.appspot.com/o/images%2Fstandard_1736493521301.png?alt=media&token=2a7c86cb-9578-4dfd-84b8-247b823e3bfaf",
            type: "paid",
            planPoints: ["حد أقصى 100 طلب", "حد أقصى 20 منتج", "صلاحية 30 يوم"],
            isActive: true,
            features: allFeatures.map(f => ({ key: f, value: true }))
        },
        {
            arabicName: "الخطة الاساسية",
            englishName: "Basic Plan",
            description: "الوصول الي جميع الميزات في لوحة التحكم",
            price: 0,
            durationDays: 365,
            totalOrders: -1,
            productsLimit: -1,
            place: "0",
            image: "https://firebasestorage.googleapis.com/v0/b/foodies-3c1d9.appspot.com/o/subscription%2Fic_sub_1.png?alt=media&token=a93a344b-6e58-4443-9e15-b2417aa16ff8",
            type: "free",
            planPoints: [
                "الوصول الي جميع الميزات في لوحة التحكم",
                "التفاعل مع المستخدمين من خلال الشات",
                "سهولة انشاء رمز الاستجابة السريع"
            ],
            isActive: true,
            features: allFeatures.map(f => ({ key: f, value: true }))
        }
    ];

    for (const { features, ...planData } of plans) {
        const plan = await prisma.subscriptionPlan.create({
            data: {
                ...planData,
                features: {
                    create: features
                }
            }
        });
        console.log(`Created plan: ${plan.arabicName} / ${plan.englishName} with ${features.length} features.`);
    }

    console.log('Subscription plans and features seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
