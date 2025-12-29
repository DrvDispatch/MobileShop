import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter }) as any;

async function importFullMasterData() {
    const inputPath = path.join(process.cwd(), 'full_master_data.json');

    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Error: ${inputPath} not found!`);
        return;
    }

    console.log('🚀 STARTING FULL MASTER DATA RESTORATION...');
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const { tables } = data;

    try {
        // --- 1. SETTINGS & INFRA ---
        console.log('⚙️ Restoring Settings & Zones...');
        for (const record of tables.setting || []) {
            await prisma.setting.upsert({ where: { id: record.id }, update: record, create: record });
        }
        for (const record of tables.shippingZone || []) {
            await prisma.shippingZone.upsert({ where: { id: record.id }, update: record, create: record });
        }

        // --- 2. CATEGORIES & PRODUCTS ---
        console.log('📂 Restoring Categories & Products...');
        for (const record of tables.category || []) {
            await prisma.category.upsert({ where: { id: record.id }, update: record, create: record });
        }
        for (const prod of tables.product || []) {
            const { images, reviews, id, ...prodData } = prod;
            await prisma.product.upsert({ where: { id }, update: prodData, create: { ...prodData, id } });

            // Nested Images/Reviews
            for (const img of images || []) {
                await prisma.productImage.upsert({ where: { id: img.id }, update: img, create: img });
            }
            for (const rev of reviews || []) {
                await prisma.productReview.upsert({ where: { id: rev.id }, update: rev, create: rev });
            }
        }

        // --- 3. REPAIR CATALOG (Strict Order!) ---
        console.log('🔧 Restoring Repair Catalog (Device Types -> Brands -> Devices ...)...');
        for (const record of tables.repairDeviceType || []) {
            await prisma.repairDeviceType.upsert({ where: { id: record.id }, update: record, create: record });
        }
        for (const record of tables.repairBrand || []) {
            await prisma.repairBrand.upsert({ where: { id: record.id }, update: record, create: record });
        }
        for (const record of tables.repairDevice || []) {
            await prisma.repairDevice.upsert({ where: { id: record.id }, update: record, create: record });
        }
        for (const record of tables.repairServiceType || []) {
            await prisma.repairServiceType.upsert({ where: { id: record.id }, update: record, create: record });
        }
        for (const record of tables.repairDeviceService || []) {
            await prisma.repairDeviceService.upsert({ where: { id: record.id }, update: record, create: record });
        }
        for (const record of tables.supportedDevice || []) {
            await prisma.supportedDevice.upsert({ where: { id: record.id }, update: record, create: record });
        }

        // --- 4. MARKETING & UI ---
        console.log('🎨 Restoring Marketing Data...');
        for (const record of tables.promotionalBanner || []) {
            await prisma.promotionalBanner.upsert({ where: { id: record.id }, update: record, create: record });
        }
        for (const record of tables.discountCode || []) {
            await prisma.discountCode.upsert({ where: { id: record.id }, update: record, create: record });
        }
        for (const record of tables.googleReview || []) {
            await prisma.googleReview.upsert({ where: { id: record.id }, update: record, create: record });
        }

        console.log('\n' + '='.repeat(50));
        console.log('🏆 RESTORATION COMPLETE: Everything is back online!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Import failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importFullMasterData();
