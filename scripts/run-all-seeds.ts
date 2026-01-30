
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

    const isProduction = __filename.endsWith('.js');
    const extension = isProduction ? '.js' : '.ts';
    const runner = isProduction ? 'node' : 'npx ts-node';

    for (const scriptName of scripts) {
        const scriptFile = scriptName.replace('.ts', extension);
        const scriptPath = path.join(__dirname, scriptFile);

        console.log(`\n📦 Running: ${scriptFile} using ${runner}...`);
        try {
            execSync(`${runner} "${scriptPath}"`, { stdio: 'inherit' });
            console.log(`✅ Successfully completed: ${scriptFile}`);
        } catch (error) {
            console.error(`❌ Error running ${scriptFile}:`, error);
        }
    }

    console.log('\n✨ All seed scripts processed!');
}

runSeeds();
