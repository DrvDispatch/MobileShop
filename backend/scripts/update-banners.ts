import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// Attractive, modern color palette
const colors = [
    { bg: '#1e40af', text: '#ffffff' }, // Deep blue
    { bg: '#7c3aed', text: '#ffffff' }, // Purple
    { bg: '#0f766e', text: '#ffffff' }, // Teal
    { bg: '#be185d', text: '#ffffff' }, // Pink
    { bg: '#c2410c', text: '#ffffff' }, // Orange
    { bg: '#4338ca', text: '#ffffff' }, // Indigo
];

async function main() {
    console.log('🔄 Updating promotional banners with varied product data...\n');

    // Get products with images
    const allProducts = await prisma.product.findMany({
        take: 200,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            brand: true,
            images: true,
        }
    });

    const products = allProducts.filter(p => p.images && p.images.length > 0);
    console.log(`Found ${products.length} products with images\n`);

    // Delete old banners
    await prisma.promotionalBanner.deleteMany({});
    console.log('✅ Deleted old banners');

    const banners: Array<{
        id: string;
        title: string;
        message: string;
        linkUrl?: string;
        linkText?: string;
        bgColor: string;
        textColor: string;
        position: 'TICKER';
        priority: number;
        isActive: boolean;
    }> = [];

    // Group products by brand (exclude BrandLogos - these are logo images, not products)
    const brandProducts: Record<string, typeof products> = {};
    for (const p of products) {
        const brand = p.brand || 'Other';
        if (brand === 'BrandLogos' || brand.toLowerCase().includes('logo')) continue;
        if (!brandProducts[brand]) brandProducts[brand] = [];
        brandProducts[brand].push(p);
    }

    console.log('\nBrands found:', Object.keys(brandProducts).join(', '));

    // Pick one product from each brand for variety
    const brands = Object.keys(brandProducts);
    let colorIndex = 0;
    let priority = 10;

    for (let i = 0; i < Math.min(4, brands.length); i++) {
        const brand = brands[i];
        const brandProdList = brandProducts[brand];
        if (brandProdList.length === 0) continue;

        // Pick a random product from this brand
        const product = brandProdList[Math.floor(Math.random() * brandProdList.length)];
        const color = colors[colorIndex % colors.length];
        colorIndex++;

        const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
        const discount = hasDiscount
            ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)
            : 0;
        const savings = hasDiscount
            ? (Number(product.compareAtPrice) - Number(product.price)).toFixed(0)
            : '0';

        let message = '';
        if (hasDiscount && discount > 0) {
            message = `${discount}% KORTING: ${product.name} - Was €${Number(product.compareAtPrice).toFixed(0)}, nu €${Number(product.price).toFixed(0)}`;
        } else {
            message = `${product.name} - Nu beschikbaar voor €${Number(product.price).toFixed(0)}`;
        }

        banners.push({
            id: `banner-${brand.toLowerCase().replace(/\s+/g, '-')}-deal`,
            title: `${brand} Deal`,
            message,
            linkUrl: `/phones/${product.slug}`,
            linkText: 'Bekijk',
            bgColor: color.bg,
            textColor: color.text,
            position: 'TICKER',
            priority: priority--,
            isActive: true,
        });
    }

    // Static banners with good colors

    // Free shipping banner
    banners.push({
        id: 'banner-free-shipping',
        title: 'Gratis Verzending',
        message: 'Gratis verzending boven €50 • Code WELKOM10 = 10% korting',
        bgColor: '#0f766e',
        textColor: '#ffffff',
        position: 'TICKER',
        priority: 6,
        isActive: true,
    });

    // Repair service - FIXED LINK
    banners.push({
        id: 'banner-repair-service',
        title: 'Reparatie Service',
        message: 'Scherm kapot? Reparatie binnen 1 uur • Walk-in welkom in Antwerpen',
        linkUrl: '/repair/book',
        linkText: 'Boek nu',
        bgColor: '#be185d',
        textColor: '#ffffff',
        position: 'TICKER',
        priority: 5,
        isActive: true,
    });

    // Warranty
    banners.push({
        id: 'banner-warranty',
        title: 'Garantie',
        message: '1 jaar garantie op alle toestellen • 30 dagen bedenktijd',
        linkUrl: '/over-ons',
        linkText: 'Meer info',
        bgColor: '#4338ca',
        textColor: '#ffffff',
        position: 'TICKER',
        priority: 4,
        isActive: true,
    });

    // Create all banners
    for (const banner of banners) {
        await prisma.promotionalBanner.create({
            data: banner,
        });
        console.log(`✅ Created: ${banner.title}`);
    }

    console.log(`\n🎉 Created ${banners.length} promotional banners!`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
