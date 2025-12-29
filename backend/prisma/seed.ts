import 'dotenv/config';
import { PrismaClient, UserRole, ProductCondition, Category, Product } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@mobileshop.com' },
        update: {},
        create: {
            email: 'admin@mobileshop.com',
            name: 'Admin User',
            passwordHash: adminPassword,
            role: UserRole.ADMIN,
            phone: '+1234567890',
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create owner admin (Nader - Super Admin)
    const ownerPassword = await bcrypt.hash('Naderi123!', 12);
    const owner = await prisma.user.upsert({
        where: { email: 'admin@smartphoneservice.be' },
        update: {
            passwordHash: ownerPassword,
        },
        create: {
            email: 'admin@smartphoneservice.be',
            name: 'Nader',
            passwordHash: ownerPassword,
            role: UserRole.ADMIN,
            phone: '+32465638106',
        },
    });
    console.log('✅ Owner admin created:', owner.email);

    // Create staff user
    const staffPassword = await bcrypt.hash('staff123', 12);
    const staff = await prisma.user.upsert({
        where: { email: 'staff@mobileshop.com' },
        update: {},
        create: {
            email: 'staff@mobileshop.com',
            name: 'Staff Member',
            passwordHash: staffPassword,
            role: UserRole.STAFF,
            phone: '+1234567891',
        },
    });
    console.log('✅ Staff user created:', staff.email);

    // Create categories
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { slug: 'phones' },
            update: {},
            create: {
                name: 'Phones',
                slug: 'phones',
                description: 'New and used smartphones',
                sortOrder: 1,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'parts' },
            update: {},
            create: {
                name: 'Parts',
                slug: 'parts',
                description: 'Replacement parts and components',
                sortOrder: 2,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'accessories' },
            update: {},
            create: {
                name: 'Accessories',
                slug: 'accessories',
                description: 'Cases, chargers, and more',
                sortOrder: 3,
            },
        }),
    ]);
    console.log('✅ Categories created:', categories.map(c => c.name).join(', '));

    // Create sample products
    const phonesCategory = categories.find(c => c.slug === 'phones');
    const partsCategory = categories.find(c => c.slug === 'parts');
    const accessoriesCategory = categories.find(c => c.slug === 'accessories');

    const products = await Promise.all([
        // Phones
        prisma.product.upsert({
            where: { slug: 'pixel-8-pro' },
            update: {},
            create: {
                name: 'Pixel 8 Pro',
                slug: 'pixel-8-pro',
                description: 'Google Pixel 8 Pro with advanced AI features and stunning camera system.',
                shortDescription: 'Flagship Google smartphone',
                price: 899,
                stockQty: 15,
                condition: ProductCondition.NEW,
                brand: 'Google',
                categoryId: phonesCategory?.id,
                isFeatured: true,
                sku: 'GOOGLE-P8P-001',
                modelCompatibility: ['Pixel 8 Pro'],
                specifications: {
                    display: '6.7" LTPO OLED',
                    storage: '128GB',
                    ram: '12GB',
                    camera: '50MP + 48MP + 48MP',
                },
            },
        }),
        prisma.product.upsert({
            where: { slug: 'iphone-15-pro' },
            update: {},
            create: {
                name: 'iPhone 15 Pro',
                slug: 'iphone-15-pro',
                description: 'Apple iPhone 15 Pro with A17 Pro chip and titanium design.',
                shortDescription: 'Premium Apple smartphone',
                price: 999,
                stockQty: 20,
                condition: ProductCondition.NEW,
                brand: 'Apple',
                categoryId: phonesCategory?.id,
                isFeatured: true,
                sku: 'APPLE-IP15P-001',
                modelCompatibility: ['iPhone 15 Pro'],
                specifications: {
                    display: '6.1" Super Retina XDR',
                    storage: '256GB',
                    ram: '8GB',
                    camera: '48MP + 12MP + 12MP',
                },
            },
        }),
        prisma.product.upsert({
            where: { slug: 'samsung-s24-ultra-used' },
            update: {},
            create: {
                name: 'Samsung S24 Ultra (Used)',
                slug: 'samsung-s24-ultra-used',
                description: 'Pre-owned Samsung Galaxy S24 Ultra in excellent condition.',
                shortDescription: 'Pre-owned Samsung flagship',
                price: 749,
                compareAtPrice: 1199,
                stockQty: 5,
                condition: ProductCondition.USED,
                brand: 'Samsung',
                categoryId: phonesCategory?.id,
                isFeatured: false,
                sku: 'SAMSUNG-S24U-USED-001',
                modelCompatibility: ['Samsung S24 Ultra'],
            },
        }),

        // iPhone 16 Refurbished - Sample product with device specs
        prisma.product.upsert({
            where: { slug: 'iphone-16-pro-max-refurbished' },
            update: {},
            create: {
                name: 'iPhone 16 Pro Max 128GB Refurbished',
                slug: 'iphone-16-pro-max-refurbished',
                description: 'Apple iPhone 16 Pro Max in excellent refurbished condition. Features the powerful A18 Pro chip, stunning 48MP camera system, and titanium design. This device has been professionally inspected, tested, and restored to full working order.',
                shortDescription: 'Refurbished iPhone 16 Pro Max - Like new condition',
                price: 899,
                compareAtPrice: 1199,
                stockQty: 3,
                condition: ProductCondition.REFURBISHED,
                brand: 'Apple',
                categoryId: phonesCategory?.id,
                isFeatured: true,
                sku: 'APPLE-IP16PM-REF-001',
                modelCompatibility: ['iPhone 16 Pro Max'],
                specifications: {
                    display: '6.9" Super Retina XDR',
                    chip: 'A18 Pro',
                    camera: '48MP + 12MP + 12MP + 5x Optical Zoom',
                },
                // Device specification fields for refurbished
                productType: 'PHONE',
                storage: '128GB',
                color: 'Desert Titanium',
                batteryHealth: 98,
                deviceGrade: 'A',
            },
        }),

        // Parts
        prisma.product.upsert({
            where: { slug: 'iphone-15-screen-replacement' },
            update: {},
            create: {
                name: 'iPhone 15 Screen Replacement Kit',
                slug: 'iphone-15-screen-replacement',
                description: 'OEM quality screen replacement kit for iPhone 15 with all tools included.',
                shortDescription: 'Complete screen replacement kit',
                price: 129,
                stockQty: 50,
                condition: ProductCondition.NEW,
                brand: 'OEM',
                categoryId: partsCategory?.id,
                isFeatured: true,
                sku: 'PART-IP15-SCREEN-001',
                modelCompatibility: ['iPhone 15', 'iPhone 15 Plus'],
            },
        }),
        prisma.product.upsert({
            where: { slug: 'galaxy-s24-battery' },
            update: {},
            create: {
                name: 'Samsung Galaxy S24 Battery',
                slug: 'galaxy-s24-battery',
                description: 'Original capacity replacement battery for Samsung Galaxy S24.',
                shortDescription: 'Replacement battery',
                price: 45,
                stockQty: 100,
                condition: ProductCondition.NEW,
                brand: 'OEM',
                categoryId: partsCategory?.id,
                isFeatured: false,
                sku: 'PART-S24-BAT-001',
                modelCompatibility: ['Samsung S24'],
            },
        }),

        // Accessories
        prisma.product.upsert({
            where: { slug: 'wireless-charging-pad' },
            update: {},
            create: {
                name: 'Wireless Charging Pad',
                slug: 'wireless-charging-pad',
                description: '15W fast wireless charging pad compatible with all Qi-enabled devices.',
                shortDescription: 'Universal wireless charger',
                price: 45,
                stockQty: 75,
                condition: ProductCondition.NEW,
                brand: 'Generic',
                categoryId: accessoriesCategory?.id,
                isFeatured: true,
                sku: 'ACC-WIRELESS-PAD-001',
                modelCompatibility: ['Universal'],
            },
        }),
        prisma.product.upsert({
            where: { slug: 'iphone-15-clear-case' },
            update: {},
            create: {
                name: 'iPhone 15 Clear Case',
                slug: 'iphone-15-clear-case',
                description: 'Crystal clear protective case for iPhone 15.',
                shortDescription: 'Clear protective case',
                price: 19,
                stockQty: 200,
                condition: ProductCondition.NEW,
                brand: 'Generic',
                categoryId: accessoriesCategory?.id,
                isFeatured: false,
                sku: 'ACC-IP15-CASE-001',
                modelCompatibility: ['iPhone 15'],
            },
        }),
    ]);
    console.log('✅ Products created:', products.map(p => p.name).join(', '));

    // Create repair services
    const repairServices = await Promise.all([
        // iPhone repairs
        prisma.repairService.upsert({
            where: {
                deviceBrand_deviceModel_issueType: {
                    deviceBrand: 'Apple',
                    deviceModel: 'iPhone 15',
                    issueType: 'screen',
                },
            },
            update: {},
            create: {
                name: 'iPhone 15 Screen Replacement',
                description: 'Replace cracked or damaged screen with OEM quality display',
                deviceBrand: 'Apple',
                deviceModel: 'iPhone 15',
                issueType: 'screen',
                basePrice: 179,
                etaMinutes: 60,
            },
        }),
        prisma.repairService.upsert({
            where: {
                deviceBrand_deviceModel_issueType: {
                    deviceBrand: 'Apple',
                    deviceModel: 'iPhone 15',
                    issueType: 'battery',
                },
            },
            update: {},
            create: {
                name: 'iPhone 15 Battery Replacement',
                description: 'Replace worn battery with new original capacity battery',
                deviceBrand: 'Apple',
                deviceModel: 'iPhone 15',
                issueType: 'battery',
                basePrice: 89,
                etaMinutes: 45,
            },
        }),
        prisma.repairService.upsert({
            where: {
                deviceBrand_deviceModel_issueType: {
                    deviceBrand: 'Apple',
                    deviceModel: 'iPhone 15 Pro',
                    issueType: 'screen',
                },
            },
            update: {},
            create: {
                name: 'iPhone 15 Pro Screen Replacement',
                description: 'Replace cracked or damaged screen with OEM quality display',
                deviceBrand: 'Apple',
                deviceModel: 'iPhone 15 Pro',
                issueType: 'screen',
                basePrice: 229,
                etaMinutes: 60,
            },
        }),

        // Samsung repairs
        prisma.repairService.upsert({
            where: {
                deviceBrand_deviceModel_issueType: {
                    deviceBrand: 'Samsung',
                    deviceModel: 'Galaxy S24',
                    issueType: 'screen',
                },
            },
            update: {},
            create: {
                name: 'Samsung S24 Screen Replacement',
                description: 'Replace cracked AMOLED display with original quality screen',
                deviceBrand: 'Samsung',
                deviceModel: 'Galaxy S24',
                issueType: 'screen',
                basePrice: 199,
                etaMinutes: 90,
            },
        }),
        prisma.repairService.upsert({
            where: {
                deviceBrand_deviceModel_issueType: {
                    deviceBrand: 'Samsung',
                    deviceModel: 'Galaxy S24',
                    issueType: 'battery',
                },
            },
            update: {},
            create: {
                name: 'Samsung S24 Battery Replacement',
                description: 'Replace worn battery with new original capacity battery',
                deviceBrand: 'Samsung',
                deviceModel: 'Galaxy S24',
                issueType: 'battery',
                basePrice: 79,
                etaMinutes: 45,
            },
        }),

        // Google repairs
        prisma.repairService.upsert({
            where: {
                deviceBrand_deviceModel_issueType: {
                    deviceBrand: 'Google',
                    deviceModel: 'Pixel 8',
                    issueType: 'screen',
                },
            },
            update: {},
            create: {
                name: 'Pixel 8 Screen Replacement',
                description: 'Replace cracked or damaged screen with quality display',
                deviceBrand: 'Google',
                deviceModel: 'Pixel 8',
                issueType: 'screen',
                basePrice: 159,
                etaMinutes: 60,
            },
        }),

        // General repairs
        prisma.repairService.upsert({
            where: {
                deviceBrand_deviceModel_issueType: {
                    deviceBrand: 'All',
                    deviceModel: 'All',
                    issueType: 'diagnostics',
                },
            },
            update: {},
            create: {
                name: 'Device Diagnostics',
                description: 'Full diagnostic check to identify issues with your device',
                deviceBrand: 'All',
                deviceModel: 'All',
                issueType: 'diagnostics',
                basePrice: 29,
                etaMinutes: 30,
            },
        }),
        prisma.repairService.upsert({
            where: {
                deviceBrand_deviceModel_issueType: {
                    deviceBrand: 'All',
                    deviceModel: 'All',
                    issueType: 'water_damage',
                },
            },
            update: {},
            create: {
                name: 'Water Damage Repair',
                description: 'Clean and repair water-damaged devices',
                deviceBrand: 'All',
                deviceModel: 'All',
                issueType: 'water_damage',
                basePrice: 99,
                etaMinutes: 180,
            },
        }),
    ]);
    console.log('✅ Repair services created:', repairServices.length);

    // Create default settings
    await prisma.setting.upsert({
        where: { key: 'store_info' },
        update: {},
        create: {
            key: 'store_info',
            value: {
                name: 'Mobile Shop',
                address: '123 Main Street, City, Country',
                phone: '+1 234 567 890',
                email: 'contact@mobileshop.com',
                openingHours: {
                    monday: '9:00 - 18:00',
                    tuesday: '9:00 - 18:00',
                    wednesday: '9:00 - 18:00',
                    thursday: '9:00 - 18:00',
                    friday: '9:00 - 18:00',
                    saturday: '10:00 - 16:00',
                    sunday: 'Closed',
                },
            },
        },
    });
    console.log('✅ Default settings created');

    // Create default settings (new format)
    const defaultSettings = [
        { key: 'store.name', value: 'Smartphone Service' },
        { key: 'store.phone', value: '+32 3 123 45 67' },
        { key: 'store.email', value: 'info@smartphoneservice.be' },
        { key: 'store.address', value: { line1: 'Korte Koepoortstraat 7', city: 'Antwerpen', postalCode: '2000', country: 'BE' } },
        { key: 'store.vatNumber', value: 'BE 1015.249.213' },
        { key: 'checkout.defaultCountry', value: 'BE' },
        { key: 'checkout.currency', value: 'EUR' },
        { key: 'checkout.currencySymbol', value: '€' },
        { key: 'checkout.taxIncluded', value: true },
        { key: 'checkout.taxRate', value: 0.21 },
        { key: 'checkout.taxLabel', value: '21% VAT' },
    ];

    for (const setting of defaultSettings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: {},
            create: { key: setting.key, value: setting.value },
        });
    }
    console.log('✅ Store settings created');

    // Create template discount codes for holidays and events
    const discountCodes = await Promise.all([
        // New Year Code
        prisma.discountCode.upsert({
            where: { code: 'NIEUWJAAR25' },
            update: {},
            create: {
                code: 'NIEUWJAAR25',
                description: 'Nieuwjaarsactie - 25% korting',
                type: 'PERCENTAGE',
                value: 25,
                minOrderAmount: 50,
                maxDiscount: 100,
                usageLimit: 100,
                perUserLimit: 1,
                startsAt: new Date('2025-01-01'),
                expiresAt: new Date('2025-01-07'),
                isActive: true,
                appliesToAll: true,
                productIds: [],
                categoryIds: [],
            },
        }),
        // Valentine's Day
        prisma.discountCode.upsert({
            where: { code: 'VALENTIJN2025' },
            update: {},
            create: {
                code: 'VALENTIJN2025',
                description: 'Valentijnsdag - €20 korting voor je geliefde',
                type: 'FIXED',
                value: 20,
                minOrderAmount: 75,
                usageLimit: 50,
                perUserLimit: 1,
                startsAt: new Date('2025-02-10'),
                expiresAt: new Date('2025-02-15'),
                isActive: true,
                appliesToAll: true,
                productIds: [],
                categoryIds: [],
            },
        }),
        // Easter
        prisma.discountCode.upsert({
            where: { code: 'PASEN2025' },
            update: {},
            create: {
                code: 'PASEN2025',
                description: 'Paaspromotie - 15% korting',
                type: 'PERCENTAGE',
                value: 15,
                minOrderAmount: 40,
                maxDiscount: 75,
                usageLimit: 200,
                perUserLimit: 2,
                startsAt: new Date('2025-04-18'),
                expiresAt: new Date('2025-04-22'),
                isActive: true,
                appliesToAll: true,
                productIds: [],
                categoryIds: [],
            },
        }),
        // Summer Sale
        prisma.discountCode.upsert({
            where: { code: 'ZOMER2025' },
            update: {},
            create: {
                code: 'ZOMER2025',
                description: 'Zomer Sale - Tot 30% korting',
                type: 'PERCENTAGE',
                value: 30,
                minOrderAmount: 100,
                maxDiscount: 150,
                usageLimit: 500,
                perUserLimit: 3,
                startsAt: new Date('2025-07-01'),
                expiresAt: new Date('2025-08-31'),
                isActive: true,
                appliesToAll: true,
                productIds: [],
                categoryIds: [],
            },
        }),
        // Black Friday
        prisma.discountCode.upsert({
            where: { code: 'BLACKFRIDAY25' },
            update: {},
            create: {
                code: 'BLACKFRIDAY25',
                description: 'Black Friday - Grootste korting van het jaar!',
                type: 'PERCENTAGE',
                value: 35,
                minOrderAmount: 50,
                maxDiscount: 200,
                usageLimit: 1000,
                perUserLimit: 1,
                startsAt: new Date('2025-11-28'),
                expiresAt: new Date('2025-12-01'),
                isActive: true,
                appliesToAll: true,
                productIds: [],
                categoryIds: [],
            },
        }),
        // Christmas
        prisma.discountCode.upsert({
            where: { code: 'KERST2025' },
            update: {},
            create: {
                code: 'KERST2025',
                description: 'Kerstactie - €30 korting',
                type: 'FIXED',
                value: 30,
                minOrderAmount: 100,
                usageLimit: 300,
                perUserLimit: 1,
                startsAt: new Date('2025-12-20'),
                expiresAt: new Date('2025-12-27'),
                isActive: true,
                appliesToAll: true,
                productIds: [],
                categoryIds: [],
            },
        }),
        // Welcome code (always active)
        prisma.discountCode.upsert({
            where: { code: 'WELKOM10' },
            update: {},
            create: {
                code: 'WELKOM10',
                description: 'Welkomstkorting voor nieuwe klanten',
                type: 'PERCENTAGE',
                value: 10,
                minOrderAmount: 25,
                maxDiscount: 50,
                perUserLimit: 1,
                isActive: true,
                appliesToAll: true,
                productIds: [],
                categoryIds: [],
            },
        }),
        // Repair discount
        prisma.discountCode.upsert({
            where: { code: 'REPAIR15' },
            update: {},
            create: {
                code: 'REPAIR15',
                description: 'Korting bij aankoop na reparatie',
                type: 'PERCENTAGE',
                value: 15,
                minOrderAmount: 30,
                maxDiscount: 40,
                perUserLimit: 1,
                isActive: true,
                appliesToAll: true,
                productIds: [],
                categoryIds: [],
            },
        }),
    ]);
    console.log('✅ Discount codes created:', discountCodes.length);

    // Create template promotional banners
    const banners = await Promise.all([
        // Main iPhone Promo
        prisma.promotionalBanner.upsert({
            where: { id: 'banner-iphone-promo' },
            update: {},
            create: {
                id: 'banner-iphone-promo',
                title: 'iPhone Sale',
                message: '🔥 iPhone 16 Pro Max Refurbished nu vanaf €899 - Bespaar tot €300! Inclusief garantie.',
                linkUrl: '/products/iphone-16-pro-max-refurbished',
                linkText: 'Bekijk nu',
                bgColor: '#1d4ed8',
                textColor: '#ffffff',
                position: 'TICKER',
                priority: 10,
                isActive: true,
            },
        }),
        // Samsung Deal
        prisma.promotionalBanner.upsert({
            where: { id: 'banner-samsung-deal' },
            update: {},
            create: {
                id: 'banner-samsung-deal',
                title: 'Samsung Deal',
                message: '📱 Samsung Galaxy S24 Ultra nu met €450 korting! Was €1199, nu €749.',
                linkUrl: '/products/samsung-s24-ultra-used',
                linkText: 'Shop nu',
                bgColor: '#7c3aed',
                textColor: '#ffffff',
                position: 'TICKER',
                priority: 8,
                isActive: true,
            },
        }),
        // Free Shipping
        prisma.promotionalBanner.upsert({
            where: { id: 'banner-free-shipping' },
            update: {},
            create: {
                id: 'banner-free-shipping',
                title: 'Gratis Verzending',
                message: '🚚 Gratis verzending bij bestellingen boven €50 - Code: WELKOM10 voor 10% extra korting!',
                bgColor: '#059669',
                textColor: '#ffffff',
                position: 'TICKER',
                priority: 5,
                isActive: true,
            },
        }),
        // Repair Service
        prisma.promotionalBanner.upsert({
            where: { id: 'banner-repair-service' },
            update: {},
            create: {
                id: 'banner-repair-service',
                title: 'Reparatie Service',
                message: '🔧 Scherm kapot? Wij repareren binnen 1 uur! Walk-in welkom of boek online.',
                linkUrl: '/repairs',
                linkText: 'Boek afspraak',
                bgColor: '#dc2626',
                textColor: '#ffffff',
                position: 'TICKER',
                priority: 7,
                isActive: true,
            },
        }),
        // Accessories Bundle
        prisma.promotionalBanner.upsert({
            where: { id: 'banner-accessoires' },
            update: {},
            create: {
                id: 'banner-accessoires',
                title: 'Accessoires Deal',
                message: '🎧 Hoesje + Oplader + Screenprotector - Complete bundel vanaf €39!',
                linkUrl: '/category/accessories',
                linkText: 'Bekijk deals',
                bgColor: '#ea580c',
                textColor: '#ffffff',
                position: 'TICKER',
                priority: 6,
                isActive: true,
            },
        }),
        // Trade-In Banner
        prisma.promotionalBanner.upsert({
            where: { id: 'banner-trade-in' },
            update: {},
            create: {
                id: 'banner-trade-in',
                title: 'Inruilen',
                message: '♻️ Ruil je oude telefoon in en krijg tot €400 korting op je nieuwe toestel!',
                linkUrl: '/trade-in',
                linkText: 'Bereken waarde',
                bgColor: '#0891b2',
                textColor: '#ffffff',
                position: 'TICKER',
                priority: 4,
                isActive: true,
            },
        }),
    ]);
    console.log('✅ Promotional banners created:', banners.length);

    // Note: Shipping zones seeding temporarily disabled
    // Run manually via API after backend starts: POST /api/settings/shipping-zones
    // Shipping zones will use defaults from settings service until admin panel is built

    console.log('🎉 Database seeding completed!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin: admin@mobileshop.com / admin123');
    console.log('   Staff: staff@mobileshop.com / staff123');
    console.log('\n🏷️ Discount codes:');
    console.log('   WELKOM10 - 10% welkomstkorting (altijd actief)');
    console.log('   REPAIR15 - 15% na reparatie (altijd actief)');
    console.log('   NIEUWJAAR25 - 25% Nieuwjaar (1-7 jan)');
    console.log('   VALENTIJN2025 - €20 korting (10-15 feb)');
    console.log('   PASEN2025 - 15% Pasen (18-22 apr)');
    console.log('   ZOMER2025 - 30% Zomer Sale (1 jul - 31 aug)');
    console.log('   BLACKFRIDAY25 - 35% Black Friday (28 nov - 1 dec)');
    console.log('   KERST2025 - €30 Kerst (20-27 dec)');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

