import { OnboardingType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOnboarding() {
    console.log('Seeding onboarding data...');

    const onboardingData = [
        {
            title: 'Choose Your Favorite Food',
            description: 'Browse through our extensive list of restaurants and dishes to find exactly what you are craving for.',
            image: 'https://img.freepik.com/free-vector/order-food-concept-illustration_114360-6861.jpg',
            type: OnboardingType.customerApp,
        },
        {
            title: 'Fast Delivery',
            description: 'Get your food delivered to your doorstep in the shortest time possible by our dedicated delivery partners.',
            image: 'https://img.freepik.com/free-vector/delivery-service-illustrated_23-2148505081.jpg',
            type: OnboardingType.customerApp,
        },
        {
            title: 'Easy Payment',
            description: 'Pay safely and securely with multiple payment options including credit cards, digital wallets, and cash on delivery.',
            image: 'https://img.freepik.com/free-vector/mobile-payments-concept-illustration_114360-1243.jpg',
            type: OnboardingType.customerApp,
        },
        {
            title: 'Welcome to Foodie Vendor',
            description: 'Grow your business by reaching thousands of customers in your city.',
            image: 'https://img.freepik.com/free-vector/restaurant-management-concept-illustration_114360-6861.jpg',
            type: OnboardingType.vendorApp,
        },
        {
            title: 'Manage Orders Effortlessly',
            description: 'Receive, process, and track all your orders in real-time with our intuitive dashboard.',
            image: 'https://img.freepik.com/free-vector/order-confirmed-concept-illustration_114360-1486.jpg',
            type: OnboardingType.vendorApp,
        },
        {
            title: 'Track Your Growth',
            description: 'Get detailed insights and analytics about your sales, earnings, and customer preferences.',
            image: 'https://img.freepik.com/free-vector/business-analytics-concept-illustration_114360-1243.jpg',
            type: OnboardingType.vendorApp,
        },
        {
            title: 'Join the Delivery Fleet',
            description: 'Become a part of Talqah delivery team and enjoy flexible working hours and competitive earnings.',
            image: 'https://img.freepik.com/free-vector/delivery-man-with-face-mask-delivering-food-scooter_23-2148530323.jpg',
            type: OnboardingType.driverApp,
        },
        {
            title: 'Smart Navigation',
            description: 'Get optimized routes and real-time updates to deliver food quickly and safely to our customers.',
            image: 'https://img.freepik.com/free-vector/gps-navigation-concept-illustration_114360-7212.jpg',
            type: OnboardingType.driverApp,
        },
        {
            title: 'Earn & Manage',
            description: 'Monitor your earnings in real-time and manage your wallet transactions with complete transparency.',
            image: 'https://img.freepik.com/free-vector/salary-payment-concept-illustration_114360-1243.jpg',
            type: OnboardingType.driverApp,
        },
        {
            title: 'Talqah Management Suite',
            description: 'Full control over your delivery ecosystem. Manage vendors, drivers, and customers from one dashboard.',
            image: 'https://img.freepik.com/free-vector/control-panel-concept-illustration_114360-7052.jpg',
            type: OnboardingType.mangerApp,
        },
        {
            title: 'Business Intelligence',
            description: 'Deep dive into performance metrics and analytics to scale your business and optimize operations.',
            image: 'https://img.freepik.com/free-vector/business-analytics-concept-illustration_114360-4667.jpg',
            type: OnboardingType.mangerApp,
        },
        {
            title: 'Platform Orchestration',
            description: 'Configure zones, payout settings, and system rules to maintain a healthy and efficient marketplace.',
            image: 'https://img.freepik.com/free-vector/settings-concept-illustration_114360-3942.jpg',
            type: OnboardingType.mangerApp,
        },
    ];

    for (const data of onboardingData) {
        await prisma.onBoarding.create({
            data,
        });
    }

    console.log(`✓ Successfully seeded ${onboardingData.length} onboarding items`);
}

seedOnboarding()
    .catch((e) => {
        console.error('Error seeding onboarding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
