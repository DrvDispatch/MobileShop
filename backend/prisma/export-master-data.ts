import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportAllData() {
    console.log('🚀 Starting Master Data Export...');

    try {
        // 1. Export Products
        const products = await prisma.product.findMany({
            include: {
                category: true,
                images: true,
            }
        });
        console.log(`📦 Exporting ${products.length} products...`);

        // 2. Export Repair Configs
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

        // 3. Export Categories
        const categories = await prisma.category.findMany();

        // 4. Export Settings
        const settings = await prisma.setting.findMany();

        const masterData = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            categories,
            products,
            repairConfig: repairBrands,
            settings
        };

        const outputPath = path.join(process.cwd(), 'master_data_export.json');
        fs.writeFileSync(outputPath, JSON.stringify(masterData, null, 2));

        console.log(`✅ Export complete! File saved to: ${outputPath}`);
        console.log('💡 You can now move this file to your VPS and use an import script to restore everything.');

    } catch (error) {
        console.error('❌ Export failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportAllData();
