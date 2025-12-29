import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportAllData() {
    console.log('🚀 Starting Comprehensive Master Data Export...');

    try {
        // 1. Export Categories
        const categories = await prisma.category.findMany();
        console.log(`📂 Exporting ${categories.length} categories...`);

        // 2. Export Products (including images and reviews)
        const products = await prisma.product.findMany({
            include: {
                images: true,
                reviews: true,
            }
        });
        console.log(`📦 Exporting ${products.length} products (with ${products.reduce((acc, p) => acc + p.images.length, 0)} images)...`);

        // 3. Export Repair Configs (The whole tree)
        const repairBrands = await prisma.repairBrand.findMany({
            include: {
                devices: {
                    include: {
                        services: true
                    }
                }
            }
        });
        console.log(`🔧 Exporting ${repairBrands.length} repair brands...`);

        // 4. Export Marketing & UI Data
        const banners = await prisma.banner.findMany();
        const discounts = await prisma.discount.findMany();
        const gallery = await prisma.galleryItem.findMany();
        console.log(`🎨 Exporting ${banners.length} banners, ${discounts.length} discounts, and ${gallery.length} gallery items...`);

        // 5. Export Settings
        const settings = await prisma.setting.findMany();

        const masterData = {
            exportedAt: new Date().toISOString(),
            version: '1.1',
            categories,
            products,
            repairConfig: repairBrands,
            banners,
            discounts,
            gallery,
            settings
        };

        const outputPath = path.join(process.cwd(), 'master_data_export.json');
        fs.writeFileSync(outputPath, JSON.stringify(masterData, null, 2));

        console.log('\n' + '='.repeat(50));
        console.log(`✅ SUCCESS! Snapshot saved to: ${outputPath}`);
        console.log(''.padStart(50, '='));
        console.log('\nIncluded in this snapshot:');
        console.log(' - ✅ Products, Prices & Full Descriptions');
        console.log(' - ✅ All Images & Icons References');
        console.log(' - ✅ Complete Repair Tree (Brands -> Devices -> Services)');
        console.log(' - ✅ Marketing (Banners, Discounts, Gallery)');
        console.log(' - ✅ System Settings');
        console.log('\nNote: User personal data and Orders were excluded.');

    } catch (error) {
        console.error('❌ Export failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportAllData();
