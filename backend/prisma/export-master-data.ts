import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter }) as any;

async function exportFullMasterData() {
    console.log('🚀 INITIALIZING FULL MASTER DATA EXPORT...');
    console.log('--- This will cover ALL products, repairs, marketing, and settings ---');

    try {
        const data: any = {
            exportedAt: new Date().toISOString(),
            version: '2.0',
            tables: {}
        };

        const exportTable = async (name: string, model: any, label: string) => {
            console.log(`📦 Exporting ${label}...`);
            const records = await model.findMany();
            data.tables[name] = records;
            console.log(`   ✅ ${records.length} records.`);
        };

        // 1. Core Shop Data
        await exportTable('category', prisma.category, 'Categories');

        console.log('📦 Exporting Products with Images/Reviews...');
        data.tables['product'] = await prisma.product.findMany({
            include: { images: true, reviews: true }
        });
        console.log(`   ✅ ${data.tables['product'].length} products.`);

        // 2. Complete Repair Catalog (The user explicitly asked for "everything")
        await exportTable('repairDeviceType', prisma.repairDeviceType, 'Repair Device Types');
        await exportTable('repairBrand', prisma.repairBrand, 'Repair Brands');
        await exportTable('repairDevice', prisma.repairDevice, 'Repair Devices');
        await exportTable('repairServiceType', prisma.repairServiceType, 'Repair Service Types');
        await exportTable('repairDeviceService', prisma.repairDeviceService, 'Device-specific Services');
        await exportTable('supportedDevice', prisma.supportedDevice, 'Supported Device List');

        // 3. Marketing & UI (Banners, Discounts, Reviews)
        await exportTable('promotionalBanner', prisma.promotionalBanner, 'Promotional Banners');
        await exportTable('discountCode', prisma.discountCode, 'Discount Codes');
        await exportTable('googleReview', prisma.googleReview, 'Google Reviews');

        // 4. Configuration & Settings
        await exportTable('setting', prisma.setting, 'System Settings');
        await exportTable('shippingZone', prisma.shippingZone, 'Shipping Zones');

        // 5. Audit & History (Optional but good for full state)
        await exportTable('auditLog', prisma.auditLog, 'Audit Logs');

        // Special check for devices.json metadata if needed (already in Git, but good to link)
        data.meta = {
            assetsNote: "All physical images are in the root /assets folder. Import script will seed them into MinIO."
        };

        const outputPath = path.join(process.cwd(), 'full_master_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        console.log('\n' + '='.repeat(50));
        console.log(`🏆 EXPORT COMPLETE: ${outputPath}`);
        console.log('='.repeat(50));
        console.log('\nIncluded EVERYTHING:');
        console.log(' - ✅ Products & Images');
        console.log(' - ✅ Full Repair Catalog (The whole multi-level tree)');
        console.log(' - ✅ Marketing, Coupons, Banners');
        console.log(' - ✅ Settings & Shipping');
        console.log(' - ✅ Google Reviews');

    } catch (error) {
        console.error('❌ Export failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportFullMasterData();
