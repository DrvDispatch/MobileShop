import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter }) as any;

async function cleanupDemoData() {
    console.log('🧹 Starting Database Cleanup (Removing Demo Data)...');

    try {
        // 1. Remove Demo Admin Users (Keeping Nader's account)
        const demoEmails = ['admin@mobileshop.com', 'staff@mobileshop.com'];
        const deletedUsers = await prisma.user.deleteMany({
            where: { email: { in: demoEmails } }
        });
        console.log(`✅ Removed ${deletedUsers.count} demo users.`);

        // 2. Remove Demo Products (Slugs from seed.ts)
        const demoProductSlugs = [
            'pixel-8-pro',
            'iphone-15-pro',
            'samsung-s24-ultra-used',
            'iphone-16-pro-max-refurbished',
            'iphone-15-screen-replacement',
            'galaxy-s24-battery',
            'wireless-charging-pad',
            'iphone-15-clear-case'
        ];
        const deletedProducts = await prisma.product.deleteMany({
            where: { slug: { in: demoProductSlugs } }
        });
        console.log(`✅ Removed ${deletedProducts.count} demo products.`);

        // 3. Remove Demo Discount Codes
        const demoDiscountCodes = [
            'NIEUWJAAR25', 'VALENTIJN2025', 'PASEN2025',
            'ZOMER2025', 'BLACKFRIDAY25', 'KERST2025',
            'WELKOM10', 'REPAIR15'
        ];
        const deletedDiscounts = await prisma.discountCode.deleteMany({
            where: { code: { in: demoDiscountCodes } }
        });
        console.log(`✅ Removed ${deletedDiscounts.count} demo discount codes.`);

        // 4. Remove Demo Banners
        const demoBannerIds = [
            'banner-iphone-promo', 'banner-samsung-deal',
            'banner-free-shipping', 'banner-repair-service',
            'banner-accessoires', 'banner-trade-in'
        ];
        const deletedBanners = await prisma.promotionalBanner.deleteMany({
            where: { id: { in: demoBannerIds } }
        });
        console.log(`✅ Removed ${deletedBanners.count} demo banners.`);

        // 5. Remove Demo Repair Services (Those with specific slugs or linked to demo models)
        // Note: Global diagnostics/water damage are kept as they are useful defaults
        console.log('💡 Kept global diagnostic services.');

        console.log('\n' + '='.repeat(50));
        console.log('✨ CLEANUP COMPLETE!');
        console.log('='.repeat(50));
        console.log('Preserved Accounts: admin@smartphoneservice.be (Nader)');
        console.log(`Remaining Products: ${await prisma.product.count()}`);
        console.log('\n🚀 Recommendation: Run the Export script again to get a clean snapshot.');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupDemoData();
