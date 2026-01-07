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
    ];

    for (const data of onboardingData) {
        await prisma.onBoarding.create({
            data,
        });
    }

    console.log('✓ Successfully seeded 3 onboarding items for customerApp');
}

seedOnboarding()
    .catch((e) => {
        console.error('Error seeding onboarding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
