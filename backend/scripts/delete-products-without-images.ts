import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔍 Finding products without images...\n');

    // Get all products and filter for empty images array
    const allProducts = await prisma.product.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            images: true,
        },
        orderBy: { createdAt: 'asc' }
    });

    const productsWithoutImages = allProducts.filter(p => !p.images || p.images.length === 0);

    console.log(`Found ${productsWithoutImages.length} products without images:\n`);

    for (const p of productsWithoutImages) {
        console.log(`  - ${p.name} (${p.slug})`);
    }

    if (productsWithoutImages.length > 0) {
        console.log('\n🗑️ Deleting products without images...');

        const ids = productsWithoutImages.map(p => p.id);

        const result = await prisma.product.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        console.log(`✅ Deleted ${result.count} products`);
    } else {
        console.log('\n✅ No products to delete');
    }
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
