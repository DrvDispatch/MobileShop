/**
 * Direct import of devices.json using Prisma
 * Run with: npx tsx scripts/import-direct.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEVICES_JSON_PATH = 'C:\\Users\\saidm\\MuhsinWeb\\devices.json';
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'https://images.smartphoneservice.be';

function getAssetUrl(relativePath: string | null): string | null {
    if (!relativePath) return null;
    return `${MINIO_PUBLIC_URL}/repairs/assets/${relativePath}`;
}

function createServiceSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

interface DeviceImport {
    name: string;
    slug: string;
    category: string;
    images: string[];
    repairs: {
        name: string;
        duration: string;
        price_text: string;
        price_value: number | null;
        icon_path: string;
    }[];
}

async function main() {
    console.log('📦 Loading devices.json...');
    const jsonData: Record<string, { smartphones?: DeviceImport[]; tablets?: DeviceImport[] }> =
        JSON.parse(fs.readFileSync(DEVICES_JSON_PATH, 'utf-8'));
    console.log(`   Found ${Object.keys(jsonData).length} brands`);

    const stats = { deviceTypes: 2, brands: 0, devices: 0, serviceTypes: 0, deviceServices: 0 };

    // Step 1: Create device types
    console.log('\n🔧 Creating device types...');
    const smartphoneType = await prisma.repairDeviceType.upsert({
        where: { slug: 'smartphone' },
        update: {},
        create: { name: 'Smartphone', slug: 'smartphone', sortOrder: 1 },
    });
    const tabletType = await prisma.repairDeviceType.upsert({
        where: { slug: 'tablet' },
        update: {},
        create: { name: 'Tablet', slug: 'tablet', sortOrder: 2 },
    });

    // Step 2: Collect all unique service types
    console.log('\n📋 Collecting service types...');
    const serviceTypeMap = new Map<string, { name: string; icon: string | null }>();
    for (const categories of Object.values(jsonData)) {
        const allDevices = [...(categories.smartphones || []), ...(categories.tablets || [])];
        for (const device of allDevices) {
            for (const repair of device.repairs || []) {
                const slug = createServiceSlug(repair.name);
                if (!serviceTypeMap.has(slug)) {
                    serviceTypeMap.set(slug, { name: repair.name, icon: repair.icon_path || null });
                }
            }
        }
    }
    console.log(`   Found ${serviceTypeMap.size} unique service types`);

    // Step 3: Create service types
    console.log('\n📝 Creating service types...');
    const serviceTypeData = Array.from(serviceTypeMap.entries()).map(([slug, data]) => ({
        name: data.name,
        slug,
        icon: getAssetUrl(data.icon),
    }));
    await prisma.repairServiceType.createMany({ data: serviceTypeData, skipDuplicates: true });
    stats.serviceTypes = serviceTypeData.length;

    // Step 4: Get service type IDs
    const allServiceTypes = await prisma.repairServiceType.findMany();
    const serviceTypeIdMap = new Map(allServiceTypes.map(st => [st.slug, st.id]));

    // Step 5: Process brands and devices
    console.log('\n📱 Creating brands, devices, and services...');
    for (const [brandName, categories] of Object.entries(jsonData)) {
        const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');

        // Smartphones
        if (categories.smartphones?.length) {
            const brand = await prisma.repairBrand.upsert({
                where: { slug: `${brandSlug}-smartphone` },
                update: {},
                create: {
                    name: brandName,
                    slug: `${brandSlug}-smartphone`,
                    deviceTypeId: smartphoneType.id,
                    logo: getAssetUrl(`BrandLogos/${brandName.toLowerCase()}.png`),
                    sortOrder: brandName === 'Apple' ? 1 : 10,
                },
            });
            stats.brands++;

            const deviceData = categories.smartphones.map(d => ({
                name: d.name,
                slug: d.slug,
                image: getAssetUrl(d.images?.[0] || null),
                brandId: brand.id,
            }));
            await prisma.repairDevice.createMany({ data: deviceData, skipDuplicates: true });
            stats.devices += categories.smartphones.length;

            // Get device IDs and create services
            const createdDevices = await prisma.repairDevice.findMany({ where: { brandId: brand.id } });
            const deviceIdMap = new Map(createdDevices.map(d => [d.slug, d.id]));

            const deviceServiceData: any[] = [];
            for (const device of categories.smartphones) {
                const deviceId = deviceIdMap.get(device.slug);
                if (!deviceId) continue;
                for (const repair of device.repairs || []) {
                    const serviceId = serviceTypeIdMap.get(createServiceSlug(repair.name));
                    if (!serviceId) continue;
                    deviceServiceData.push({
                        deviceId,
                        serviceId,
                        price: repair.price_value,
                        priceText: repair.price_text || null,
                        duration: repair.duration || null,
                    });
                }
            }
            if (deviceServiceData.length > 0) {
                await prisma.repairDeviceService.createMany({ data: deviceServiceData, skipDuplicates: true });
                stats.deviceServices += deviceServiceData.length;
            }
            console.log(`   ${brandName} smartphones: ${categories.smartphones.length} devices`);
        }

        // Tablets
        if (categories.tablets?.length) {
            const brand = await prisma.repairBrand.upsert({
                where: { slug: `${brandSlug}-tablet` },
                update: {},
                create: {
                    name: brandName,
                    slug: `${brandSlug}-tablet`,
                    deviceTypeId: tabletType.id,
                    logo: getAssetUrl(`BrandLogos/${brandName.toLowerCase()}.png`),
                    sortOrder: brandName === 'Apple' ? 1 : 10,
                },
            });
            stats.brands++;

            const deviceData = categories.tablets.map(d => ({
                name: d.name,
                slug: d.slug,
                image: getAssetUrl(d.images?.[0] || null),
                brandId: brand.id,
            }));
            await prisma.repairDevice.createMany({ data: deviceData, skipDuplicates: true });
            stats.devices += categories.tablets.length;

            const createdDevices = await prisma.repairDevice.findMany({ where: { brandId: brand.id } });
            const deviceIdMap = new Map(createdDevices.map(d => [d.slug, d.id]));

            const deviceServiceData: any[] = [];
            for (const device of categories.tablets) {
                const deviceId = deviceIdMap.get(device.slug);
                if (!deviceId) continue;
                for (const repair of device.repairs || []) {
                    const serviceId = serviceTypeIdMap.get(createServiceSlug(repair.name));
                    if (!serviceId) continue;
                    deviceServiceData.push({
                        deviceId,
                        serviceId,
                        price: repair.price_value,
                        priceText: repair.price_text || null,
                        duration: repair.duration || null,
                    });
                }
            }
            if (deviceServiceData.length > 0) {
                await prisma.repairDeviceService.createMany({ data: deviceServiceData, skipDuplicates: true });
                stats.deviceServices += deviceServiceData.length;
            }
            console.log(`   ${brandName} tablets: ${categories.tablets.length} devices`);
        }
    }

    console.log('\n✅ Import complete!');
    console.log('   Device types:', stats.deviceTypes);
    console.log('   Brands:', stats.brands);
    console.log('   Devices:', stats.devices);
    console.log('   Service types:', stats.serviceTypes);
    console.log('   Device services:', stats.deviceServices);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
