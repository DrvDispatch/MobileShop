/**
 * Import devices.json directly into database (bypasses auth)
 * Run with: npx ts-node scripts/import-devices-json.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient();

// Path to devices.json
const DEVICES_JSON_PATH = path.join(__dirname, '..', '..', '..', 'devices.json');
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'https://images.smartphoneservice.be';

interface Repair {
    name: string;
    duration: string;
    price_text: string;
    price_value: number | null;
    icon_path?: string;
}

interface Device {
    name: string;
    slug: string;
    category: string;
    images: string[];
    repairs: Repair[];
}

interface DevicesJson {
    [brand: string]: {
        smartphones?: Device[];
        tablets?: Device[];
    };
}

function getAssetUrl(relativePath: string | null): string | null {
    if (!relativePath) return null;
    return `${MINIO_PUBLIC_URL}/repairs/assets/${relativePath}`;
}

function getBrandLogoUrl(brandName: string): string | null {
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
    console.log('📦 Importing devices.json...\n');
    console.log(`File: ${DEVICES_JSON_PATH}\n`);

    // Read JSON file
    if (!fs.existsSync(DEVICES_JSON_PATH)) {
        console.error('❌ devices.json not found!');
        process.exit(1);
    }

    const data: DevicesJson = JSON.parse(fs.readFileSync(DEVICES_JSON_PATH, 'utf-8'));
    const brands = Object.keys(data);
    console.log(`📱 Found ${brands.length} brands: ${brands.join(', ')}\n`);

    const stats = {
        deviceTypes: 0,
        brands: 0,
        devices: 0,
        serviceTypes: 0,
        deviceServices: 0,
    };

    // Step 1: Ensure device types exist
    console.log('1️⃣  Creating device types...');
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
    stats.deviceTypes = 2;
    console.log('   ✅ Smartphone & Tablet types ready\n');

    // Step 2: Collect all unique service types
    console.log('2️⃣  Collecting service types...');
    const allServiceTypes = new Map<string, { icon: string | null }>();
    for (const [brandName, categories] of Object.entries(data)) {
        for (const device of [...(categories.smartphones || []), ...(categories.tablets || [])]) {
            for (const repair of device.repairs) {
                const slug = repair.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                if (!allServiceTypes.has(slug)) {
                    allServiceTypes.set(slug, {
                        icon: repair.icon_path ? getAssetUrl(repair.icon_path) : null,
                    });
                }
            }
        }
    }
    console.log(`   Found ${allServiceTypes.size} unique service types\n`);

    // Step 3: Create service types
    console.log('3️⃣  Creating service types...');
    const serviceTypeMap = new Map<string, string>();
    for (const [slug, data] of allServiceTypes) {
        const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const existing = await prisma.repairServiceType.findUnique({ where: { slug } });
        if (existing) {
            serviceTypeMap.set(slug, existing.id);
        } else {
            const created = await prisma.repairServiceType.create({
                data: { name, slug, icon: data.icon },
            });
            serviceTypeMap.set(slug, created.id);
            stats.serviceTypes++;
        }
    }
    console.log(`   ✅ ${stats.serviceTypes} new service types created\n`);

    // Step 4: Process each brand
    console.log('4️⃣  Processing brands and devices...');
    let brandOrder = 0;
    for (const [brandName, categories] of Object.entries(data)) {
        const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
        process.stdout.write(`   ${brandName}: `);

        // Process smartphones
        if (categories.smartphones?.length) {
            const brand = await prisma.repairBrand.upsert({
                where: { slug: `${brandSlug}-smartphone` },
                update: { logo: getBrandLogoUrl(brandName) },
                create: {
                    name: brandName,
                    slug: `${brandSlug}-smartphone`,
                    deviceTypeId: smartphoneType.id,
                    logo: getBrandLogoUrl(brandName),
                    sortOrder: brandName === 'Apple' ? 1 : brandName === 'Samsung' ? 2 : 10 + brandOrder,
                },
            });
            stats.brands++;

            for (const device of categories.smartphones) {
                const deviceResult = await prisma.repairDevice.upsert({
                    where: { slug: device.slug },
                    update: { image: device.images[0] ? getAssetUrl(`${brandName}/${device.name}/${device.images[0].split('/').pop()}`) : null },
                    create: {
                        name: device.name,
                        slug: device.slug,
                        brandId: brand.id,
                        image: device.images[0] ? getAssetUrl(`${brandName}/${device.name}/${device.images[0].split('/').pop()}`) : null,
                    },
                });
                stats.devices++;

                // Create device services (pricing)
                for (const repair of device.repairs) {
                    const serviceSlug = repair.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    const serviceTypeId = serviceTypeMap.get(serviceSlug);
                    if (serviceTypeId) {
                        await prisma.repairDeviceService.upsert({
                            where: {
                                deviceId_serviceId: {
                                    deviceId: deviceResult.id,
                                    serviceId: serviceTypeId,
                                },
                            },
                            update: { price: repair.price_value, duration: repair.duration },
                            create: {
                                deviceId: deviceResult.id,
                                serviceId: serviceTypeId,
                                price: repair.price_value,
                                duration: repair.duration,
                            },
                        });
                        stats.deviceServices++;
                    }
                }
            }
            process.stdout.write(`${categories.smartphones.length} smartphones `);
        }

        // Process tablets
        if (categories.tablets?.length) {
            const brand = await prisma.repairBrand.upsert({
                where: { slug: `${brandSlug}-tablet` },
                update: { logo: getBrandLogoUrl(brandName) },
                create: {
                    name: brandName,
                    slug: `${brandSlug}-tablet`,
                    deviceTypeId: tabletType.id,
                    logo: getBrandLogoUrl(brandName),
                    sortOrder: brandName === 'Apple' ? 1 : brandName === 'Samsung' ? 2 : 10 + brandOrder,
                },
            });
            stats.brands++;

            for (const device of categories.tablets) {
                const deviceResult = await prisma.repairDevice.upsert({
                    where: { slug: device.slug },
                    update: { image: device.images[0] ? getAssetUrl(`${brandName}/${device.name}/${device.images[0].split('/').pop()}`) : null },
                    create: {
                        name: device.name,
                        slug: device.slug,
                        brandId: brand.id,
                        image: device.images[0] ? getAssetUrl(`${brandName}/${device.name}/${device.images[0].split('/').pop()}`) : null,
                    },
                });
                stats.devices++;

                for (const repair of device.repairs) {
                    const serviceSlug = repair.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    const serviceTypeId = serviceTypeMap.get(serviceSlug);
                    if (serviceTypeId) {
                        await prisma.repairDeviceService.upsert({
                            where: {
                                deviceId_serviceId: {
                                    deviceId: deviceResult.id,
                                    serviceId: serviceTypeId,
                                },
                            },
                            update: { price: repair.price_value, duration: repair.duration },
                            create: {
                                deviceId: deviceResult.id,
                                serviceId: serviceTypeId,
                                price: repair.price_value,
                                duration: repair.duration,
                            },
                        });
                        stats.deviceServices++;
                    }
                }
            }
            process.stdout.write(`${categories.tablets.length} tablets`);
        }

        console.log(' ✅');
        brandOrder++;
    }

    console.log('\n📊 Import Summary:');
    console.log(`   Device Types: ${stats.deviceTypes}`);
    console.log(`   Brands: ${stats.brands}`);
    console.log(`   Devices: ${stats.devices}`);
    console.log(`   Service Types: ${stats.serviceTypes}`);
    console.log(`   Device Services: ${stats.deviceServices}`);
    console.log('\n✅ Import complete!');

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
