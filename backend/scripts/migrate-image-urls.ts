/**
 * Migration script to update image URLs from Cloudflare tunnel to localhost MinIO
 * 
 * Usage: npx tsx scripts/migrate-image-urls.ts
 * 
 * This script updates all ProductImage URLs from:
 *   https://images.smartphoneservice.be/...
 * to:
 *   http://localhost:9002/...
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient();

const OLD_URL = 'https://images.smartphoneservice.be';
const NEW_URL = 'http://localhost:9002';

async function migrateImageUrls() {
    console.log('🔄 Starting image URL migration...');
    console.log(`   From: ${OLD_URL}`);
    console.log(`   To: ${NEW_URL}`);
    console.log('');

    // Get all product images
    const images = await prisma.productImage.findMany({
        where: {
            url: {
                startsWith: OLD_URL
            }
        }
    });

    console.log(`📦 Found ${images.length} images to migrate`);

    if (images.length === 0) {
        console.log('✅ No images need migration');
        return;
    }

    // Update each image URL
    let updated = 0;
    for (const image of images) {
        const newUrl = image.url.replace(OLD_URL, NEW_URL);

        await prisma.productImage.update({
            where: { id: image.id },
            data: { url: newUrl }
        });

        updated++;
        if (updated % 50 === 0) {
            console.log(`   Updated ${updated}/${images.length} images...`);
        }
    }

    console.log('');
    console.log(`✅ Successfully migrated ${updated} image URLs!`);
}

async function main() {
    try {
        await migrateImageUrls();
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
