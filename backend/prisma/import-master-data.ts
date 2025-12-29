import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter }) as any;

async function importAllData() {
    const inputPath = path.join(process.cwd(), 'master_data_export.json');

    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Error: ${inputPath} not found!`);
        return;
    }

    console.log('🚀 Starting Master Data Import...');
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

    try {
        // 1. Sync Categories
        console.log('📦 Syncing Categories...');
        for (const cat of data.categories) {
            await prisma.category.upsert({
                where: { id: cat.id },
                update: { name: cat.name, description: cat.description, slug: cat.slug },
                create: cat,
            });
        }

        // 2. Sync Products
        console.log(`📱 Syncing ${data.products.length} Products...`);
        for (const prod of data.products) {
            const { category, images, id, ...prodData } = prod;
            await prisma.product.upsert({
                where: { id },
                update: prodData,
                create: { ...prodData, id },
            });
        }

        // 3. Sync Repair Config (Recursive)
        console.log(`🔧 Syncing ${data.repairConfig.length} Repair Brands...`);
        for (const brand of data.repairConfig) {
            const { devices, id, ...brandData } = brand;

            // Upsert Brand
            await prisma.repairBrand.upsert({
                where: { id },
                update: brandData,
                create: { ...brandData, id },
            });

            // Upsert Devices for this Brand
            for (const device of devices) {
                const { services, id: deviceId, ...deviceData } = device;
                await prisma.repairDevice.upsert({
                    where: { id: deviceId },
                    update: deviceData,
                    create: { ...deviceData, id: deviceId },
                });

                // Upsert Services for this Device
                for (const service of services) {
                    const { id: serviceId, ...serviceData } = service;
                    await prisma.repairService.upsert({
                        where: { id: serviceId },
                        update: serviceData,
                        create: { ...serviceData, id: serviceId },
                    });
                }
            }
        }

        // 4. Sync Marketing & UI
        console.log('🎨 Syncing Banners and Discounts...');
        for (const banner of data.banners || []) {
            await prisma.promotionalBanner.upsert({
                where: { id: banner.id },
                update: banner,
                create: banner,
            });
        }
        for (const discount of data.discounts || []) {
            await prisma.discountCode.upsert({
                where: { id: discount.id },
                update: discount,
                create: discount,
            });
        }

        // 5. Sync Google Reviews
        console.log('⭐ Syncing Google Reviews...');
        for (const review of data.googleReviews || []) {
            await prisma.googleReview.upsert({
                where: { id: review.id },
                update: review,
                create: review,
            });
        }

        // 6. Sync Settings
        console.log('⚙️ Syncing Settings...');
        for (const setting of data.settings) {
            await prisma.setting.upsert({
                where: { id: setting.id },
                update: { value: setting.value },
                create: setting,
            });
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ MASTER DATA RESTORATION COMPLETE!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Import failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importAllData();
