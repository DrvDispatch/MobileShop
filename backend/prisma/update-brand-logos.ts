import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The public URL base for the brand logos
// These should be served from your Next.js public folder or MinIO
const LOGO_BASE_URL = '/brand-logos/smartphone';

// Brand slug to logo filename mapping
const brandLogos: Record<string, string> = {
    'apple': 'apple.webp',
    'samsung': 'samsung.webp',
    'xiaomi': 'xiaomi.webp',
    'oneplus': 'oneplus.webp',
    'oppo': 'oppo.webp',
    'google': 'google.webp',
    'huawei': 'huawei.webp',
    'motorola': 'motorola.webp',
    'nokia': 'nokia.webp',
    'sony': 'sony.webp',
    'fairphone': 'fairphone.webp',
    'asus': 'asus.webp',
    'cat': 'cat.webp',
    'lenovo': 'lenovo.webp',
};

async function main() {
    console.log('Updating brand logos...\n');

    // Get all brands
    const brands = await prisma.repairBrand.findMany();
    console.log(`Found ${brands.length} brands in database\n`);

    for (const brand of brands) {
        const logoFilename = brandLogos[brand.slug.toLowerCase()];

        if (logoFilename) {
            const newLogoUrl = `${LOGO_BASE_URL}/${logoFilename}`;

            await prisma.repairBrand.update({
                where: { id: brand.id },
                data: { logo: newLogoUrl },
            });

            console.log(`✓ ${brand.name}: ${newLogoUrl}`);
        } else {
            console.log(`✗ ${brand.name}: No logo file found for slug "${brand.slug}"`);
        }
    }

    console.log('\nDone!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
