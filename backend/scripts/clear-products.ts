/**
 * Delete all products from the database
 * Run with: npx ts-node scripts/clear-products.ts
 */

import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Deleting all products from database...\n');

    // Count products before
    const countBefore = await prisma.product.count();
    console.log(`Found ${countBefore} products to delete\n`);

    if (countBefore === 0) {
        console.log('✅ Database already empty');
        return;
    }

    // Delete all products (this will cascade to related records)
    const deleted = await prisma.product.deleteMany();

    console.log(`✅ Deleted ${deleted.count} products`);
    console.log('📦 All categories are now empty');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
