
import { execSync } from 'child_process';
import * as path from 'path';

const scripts = [
    'seed-zones.ts',
    'seed-languages.ts',
    'seed-currencies.ts',
    'seed-vendor-type.ts',
    'seed-vendor-categories.ts',
    'seed-egy-vendors.ts',
    'seed-banners.ts',
    'seed-subscription-plans.ts',
    'seed-week-days.ts',
    'seed-onboarding.ts',
    'seed-documents.ts',
    'seed-notification-templates.ts',
    'seed-add-app-settings.ts',
    'seed-managers.ts',
];

async function runSeeds() {
    console.log('🚀 Starting database seeding process...');

    for (const script of scripts) {
        const scriptPath = path.join(__dirname, script);
        console.log(`\n📦 Running: ${script}...`);
        try {
            execSync(`npx ts-node "${scriptPath}"`, { stdio: 'inherit' });
            console.log(`✅ Successfully completed: ${script}`);
        } catch (error) {
            console.error(`❌ Error running ${script}:`, error);
            // We continue to next script as some might fail if data already exists or other non-critical reasons
        }
    }

    console.log('\n✨ All seed scripts processed!');
}

runSeeds();
