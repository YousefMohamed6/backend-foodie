import { OnboardingType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOnboarding() {
    console.log('Seeding Lux Station onboarding data...');

    // Clear existing onboarding data to avoid duplicates if re-running
    await prisma.onBoarding.deleteMany({});

    const onboardingData = [
        {
            title: 'Global Flavors, Local Luxury',
            description: 'Experience a curated selection of the finest local and international cuisines, delivered with unparalleled sophistication.',
            image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000', // Placeholder or real URL if hosted
            type: OnboardingType.customerApp,
        },
        {
            title: 'Precision in Every Delivery',
            description: 'Our dedicated partners ensure your gourmet meals arrive fresh and on time, maintaining the highest standards of service.',
            image: 'https://images.unsplash.com/photo-1526367790999-0150786486a9?auto=format&fit=crop&q=80&w=1000',
            type: OnboardingType.customerApp,
        },
        {
            title: 'The Art of Dining at Home',
            description: 'Transform your home into a five-star restaurant. Lux Station brings the fine dining experience directly to your doorstep.',
            image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1000',
            type: OnboardingType.customerApp,
        },
        {
            title: 'Welcome to Lux Station Vendor',
            description: 'Partner with the most exclusive delivery network in Egypt and scale your business with premium customers.',
            image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1000',
            type: OnboardingType.vendorApp,
        },
        {
            title: 'Intelligent Business Management',
            description: 'Manage your high-end kitchen operations with real-time insights and a streamlined ordering system.',
            image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1000',
            type: OnboardingType.vendorApp,
        },
        {
            title: 'Lux Station Partner',
            description: 'Join an elite fleet of delivery professionals and enjoy flexible schedules with premium earnings.',
            image: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a1930?auto=format&fit=crop&q=80&w=1000',
            type: OnboardingType.driverApp,
        },
        {
            title: 'Advanced Navigation',
            description: 'Deliver excellence with optimized routes and real-time support from the Lux Station management team.',
            image: 'https://images.unsplash.com/photo-1524613032530-43421e546e54?auto=format&fit=crop&q=80&w=1000',
            type: OnboardingType.driverApp,
        },
        {
            title: 'Lux Station Management Suite',
            description: 'Oversee your entire luxury ecosystem. Monitor vendors, drivers, and quality standards from one powerful dashboard.',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000',
            type: OnboardingType.mangerApp,
        },
    ];

    for (const data of onboardingData) {
        await prisma.onBoarding.create({
            data,
        });
    }

    console.log(`✓ Successfully seeded ${onboardingData.length} Lux Station onboarding items`);
}

seedOnboarding()
    .catch((e) => {
        console.error('Error seeding onboarding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
