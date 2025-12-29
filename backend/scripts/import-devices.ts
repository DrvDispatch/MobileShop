/**
 * Import devices.json into database
 * Run with: npx tsx scripts/import-devices.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';

// Use fetch to call the local API
const API_URL = 'http://localhost:3001';
const DEVICES_JSON_PATH = 'C:\\Users\\saidm\\MuhsinWeb\\devices.json';

async function main() {
    console.log('📦 Loading devices.json...');
    const jsonData = JSON.parse(fs.readFileSync(DEVICES_JSON_PATH, 'utf-8'));
    console.log(`   Found ${Object.keys(jsonData).length} brands`);

    // First, we need to get an auth token
    console.log('\n🔐 Authenticating...');
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@smartphoneservice.be',
            password: 'admin123',
        }),
    });

    if (!loginRes.ok) {
        console.error('❌ Login failed. Make sure admin user exists.');
        process.exit(1);
    }

    const { access_token } = await loginRes.json();
    console.log('   ✅ Authenticated');

    console.log('\n📤 Importing data (this may take a minute)...');
    const importRes = await fetch(`${API_URL}/api/repairs/admin/import`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({ data: jsonData }),
    });

    if (!importRes.ok) {
        console.error(`❌ Import failed: ${importRes.status}`);
        const text = await importRes.text();
        console.error(text);
        process.exit(1);
    }

    const result = await importRes.json();
    console.log('\n✅ Import complete!');
    console.log('   Device types:', result.deviceTypes);
    console.log('   Brands:', result.brands);
    console.log('   Devices:', result.devices);
    console.log('   Service types:', result.serviceTypes);
}

main().catch(console.error);
