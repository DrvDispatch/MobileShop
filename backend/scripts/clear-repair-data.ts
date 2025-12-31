import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient();

async function clearTenantRepairData() {
    const tenantId = process.argv[2] || '3beba920-8e23-4283-a8ea-91a2dfe2baf7';
    console.log('Clearing ALL repair data for tenant:', tenantId);

    const deviceServices = await prisma.repairDeviceService.deleteMany({ where: { tenantId } });
    console.log(`Deleted ${deviceServices.count} device services`);

    const devices = await prisma.repairDevice.deleteMany({ where: { tenantId } });
    console.log(`Deleted ${devices.count} devices`);

    const brands = await prisma.repairBrand.deleteMany({ where: { tenantId } });
    console.log(`Deleted ${brands.count} brands`);

    const serviceTypes = await prisma.repairServiceType.deleteMany({ where: { tenantId } });
    console.log(`Deleted ${serviceTypes.count} service types`);

    console.log('\n✅ Done! Now click "Seed Repair Catalog" in Owner Panel');
    await prisma.$disconnect();
}

clearTenantRepairData().catch(console.error);
