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
