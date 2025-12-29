/**
 * Import tablets from devices.json to SupportedDevices table
 * This script reads the tablets section from devices.json and adds them to
 * the supportedDevice table for appointment booking.
 * 
 * Run with: npx tsx scripts/import-tablets.ts
 */
import 'dotenv/config';
import * as fs from 'fs';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const DEVICES_JSON_PATH = 'C:\\Users\\saidm\\MuhsinWeb\\devices.json';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface DeviceData {
    name: string;
    slug: string;
    category: string;
    images: string[];
    repairs: unknown[];
}

interface BrandData {
    smartphones?: DeviceData[];
    tablets?: DeviceData[];
}

async function main() {
    console.log('📱 Loading devices.json...\n');

    const jsonData: Record<string, BrandData> = JSON.parse(fs.readFileSync(DEVICES_JSON_PATH, 'utf-8'));

    const devices: { brand: string; model: string; sortOrder: number }[] = [];

    // Process each brand
    for (const [brandName, categories] of Object.entries(jsonData)) {
        console.log(`📦 ${brandName}:`);

        // Add tablets
        if (categories.tablets && categories.tablets.length > 0) {
            console.log(`   └─ ${categories.tablets.length} tablets`);

            let sortOrder = 100; // Tablets after smartphones
            for (const tablet of categories.tablets) {
                devices.push({
                    brand: brandName,
                    model: tablet.name,
                    sortOrder: sortOrder++,
                });
            }
        }
    }

    console.log(`\n📤 Importing ${devices.length} tablets to SupportedDevices...\n`);

    // Bulk create devices (skip duplicates)
    let created = 0;
    let skipped = 0;

    for (const device of devices) {
        try {
            await prisma.supportedDevice.create({
                data: {
                    brand: device.brand,
                    model: device.model,
                    isActive: true,
                    sortOrder: device.sortOrder,
                },
            });
            created++;
            console.log(`   ✅ ${device.brand} ${device.model}`);
        } catch (error) {
            // Skip duplicates
            skipped++;
        }
    }

    console.log('\n━'.repeat(50));
    console.log(`\n✅ Complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped (already exist): ${skipped}\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
