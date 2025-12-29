/**
 * Clear repair catalog data
 * Run with: npx tsx scripts/clear-repairs.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ Clearing repair catalog data...');

    // Delete in order due to foreign key constraints
    const ds = await prisma.repairDeviceService.deleteMany();
    console.log(`   Deleted ${ds.count} device services`);

    const d = await prisma.repairDevice.deleteMany();
    console.log(`   Deleted ${d.count} devices`);

    const b = await prisma.repairBrand.deleteMany();
    console.log(`   Deleted ${b.count} brands`);

    const st = await prisma.repairServiceType.deleteMany();
    console.log(`   Deleted ${st.count} service types`);

    const dt = await prisma.repairDeviceType.deleteMany();
    console.log(`   Deleted ${dt.count} device types`);

    console.log('✅ Done! Database cleared.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
