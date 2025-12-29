/**
 * Update all brand logos in the database
 * Run with: npx ts-node scripts/update-brand-logos.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'https://images.smartphoneservice.be';

function getBrandLogoUrl(brandName: string): string {
    const logoMap: Record<string, string> = {
        'Apple': 'Apple-logo-300x166.webp',
        'Samsung': 'Samsung-logo-300x166.webp',
        'Xiaomi': 'Xiaomi-logo-300x166.webp',
        'Huawei': 'Huawei-logo-300x166.webp',
        'Oppo': 'Oppo-logo-300x166.webp',
        'OnePlus': 'Oneplus-logo-300x166.webp',
        'Oneplus': 'Oneplus-logo-300x166.webp',
        'Google Pixel': 'Google-pixel-logo-300x166.webp',
        'Google': 'Google-logo-300x166.webp',
        'Sony': 'Sony-logo-300x166.webp',
        'Asus': 'Asus-logo-300x166.webp',
        'Motorola': 'Motorola-logo-300x166.webp',
        'Nokia': 'Nokia-logo-300x166.webp',
        'Fairphone': 'Fairphone-logo-300x166.webp',
        'Cat': 'Cat-logo-300x166.webp',
        'CAT': 'Cat-logo-300x166.webp',
        'Lenovo': 'Lenovo-logo-300x166.webp',
    };

    let filename = logoMap[brandName];
    if (!filename) {
        filename = `${brandName}-logo-300x166.webp`;
    }

    return `${MINIO_PUBLIC_URL}/repairs/assets/BrandLogos/${filename}`;
}

async function main() {
    console.log('🔄 Updating brand logos in database...\n');

    const brands = await prisma.repairBrand.findMany();
    console.log(`Found ${brands.length} brands\n`);

    let updated = 0;
    for (const brand of brands) {
        const correctLogoUrl = getBrandLogoUrl(brand.name);

        if (brand.logo !== correctLogoUrl) {
            await prisma.repairBrand.update({
                where: { id: brand.id },
                data: { logo: correctLogoUrl },
            });
            console.log(`✅ ${brand.name}: ${correctLogoUrl}`);
            updated++;
        } else {
            console.log(`✓  ${brand.name}: already correct`);
        }
    }

    console.log(`\n📊 Updated ${updated} brands`);
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
