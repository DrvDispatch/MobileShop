// Migration script to create default tenant and backfill existing data
// Run with: npx tsx prisma/seed-default-tenant.ts

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

// Create Prisma client with PrismaPg adapter (matching prisma.service.ts pattern)
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});

const DEFAULT_TENANT_ID = 'default-tenant-00000000-0000-0000';
const DEFAULT_DOMAIN = 'smartphoneservice.be';

async function seedDefaultTenant() {
    console.log('🏪 Creating default tenant...');

    // Check if default tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
        where: { id: DEFAULT_TENANT_ID }
    });

    if (existingTenant) {
        console.log('✅ Default tenant already exists, skipping creation');
        return existingTenant;
    }

    // Create default tenant
    const tenant = await prisma.tenant.create({
        data: {
            id: DEFAULT_TENANT_ID,
            name: 'Smartphone Service',
            slug: 'smartphoneservice',
            status: 'ACTIVE',
        }
    });

    console.log('✅ Default tenant created:', tenant.id);

    // Create default domain (production) - pre-verified
    await prisma.tenantDomain.create({
        data: {
            tenantId: tenant.id,
            domain: DEFAULT_DOMAIN,
            isPrimary: true,
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date(),
        }
    });
    console.log('✅ Production domain created:', DEFAULT_DOMAIN);

    // Create localhost domain for local development - pre-verified
    // Note: Middleware normalizes domains by stripping port, so "localhost:3000" → "localhost"
    await prisma.tenantDomain.create({
        data: {
            tenantId: tenant.id,
            domain: 'localhost',
            isPrimary: false,
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date(),
        }
    });
    console.log('✅ Development domain created: localhost');

    // Create default tenant config with existing shop settings
    await prisma.tenantConfig.create({
        data: {
            tenantId: tenant.id,
            shopName: 'Smartphone Service',
            primaryColor: '#7c3aed',
            email: 'contact@smartphoneservice.be',
            phone: '+32 XXX XX XX XX',
            whatsappNumber: '+32XXXXXXXXX',
            locale: 'nl',
            currency: 'EUR',
            currencySymbol: '€',
            timezone: 'Europe/Brussels',
            closedDays: [0], // Sunday closed
            timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
            // Invoice settings from existing hardcoded values
            companyName: 'Smartphone Service',
            vatNumber: 'BE 1015.249.213',
            invoicePrefix: 'INV',
            // Google Analytics and Cookiebot from existing layout.tsx
            googleAnalyticsId: 'G-B1FF2SS3XL',
            cookiebotId: 'd536f656-4b66-4a04-80fc-b5386e54c7a4',
            // SEO
            seoTitle: 'Smartphone Service | Refurbished Phones & Repairs',
            seoDescription: 'Premium refurbished smartphones and professional repair services in Antwerpen, Belgium.',
            // Feature flags
            features: JSON.stringify({ ecommerce: true, tickets: true, marketing: true }),
        }
    });

    console.log('✅ Default tenant config created');

    return tenant;
}

async function seedOwnerUser() {
    console.log('👤 Creating OWNER user...');

    const existingOwner = await prisma.user.findFirst({
        where: { role: 'OWNER' }
    });

    if (existingOwner) {
        console.log('✅ OWNER user already exists:', existingOwner.email);
        return existingOwner;
    }

    // Create platform owner user with bcrypt hash
    // Password: "ServicePulse2024!" (change in production)
    const OWNER_PASSWORD_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3oK7.XRe6.' // bcrypt hash

    const owner = await prisma.user.create({
        data: {
            tenantId: null, // OWNER has no tenant
            email: 'owner@servicepulse.com',
            name: 'Platform Owner',
            role: 'OWNER',
            passwordHash: OWNER_PASSWORD_HASH,
            emailVerified: new Date(),
            isActive: true,
        }
    });

    console.log('✅ OWNER user created:', owner.email);
    return owner;
}

async function backfillTenantIds() {
    console.log('📊 Backfilling tenantId for existing data...');

    // Get all tables that need tenantId backfill
    const tablesWithCounts: Record<string, number> = {};

    // Users (exclude OWNER users - they should remain platform-level with tenantId: null)
    const usersUpdated = await prisma.user.updateMany({
        where: {
            tenantId: null,
            role: { not: 'OWNER' }  // Don't assign OWNER users to any tenant
        },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['User'] = usersUpdated.count;

    // Categories
    const categoriesUpdated = await prisma.category.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['Category'] = categoriesUpdated.count;

    // Products
    const productsUpdated = await prisma.product.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['Product'] = productsUpdated.count;

    // Orders
    const ordersUpdated = await prisma.order.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['Order'] = ordersUpdated.count;

    // Appointments
    const appointmentsUpdated = await prisma.appointment.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['Appointment'] = appointmentsUpdated.count;

    // Tickets
    const ticketsUpdated = await prisma.ticket.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['Ticket'] = ticketsUpdated.count;

    // RepairTickets
    const repairTicketsUpdated = await prisma.repairTicket.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['RepairTicket'] = repairTicketsUpdated.count;

    // Invoices
    const invoicesUpdated = await prisma.invoice.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['Invoice'] = invoicesUpdated.count;

    // Settings
    const settingsUpdated = await prisma.setting.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['Setting'] = settingsUpdated.count;

    // PromotionalBanners
    const bannersUpdated = await prisma.promotionalBanner.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['PromotionalBanner'] = bannersUpdated.count;

    // DiscountCodes
    const discountsUpdated = await prisma.discountCode.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['DiscountCode'] = discountsUpdated.count;

    // ShippingZones
    const shippingUpdated = await prisma.shippingZone.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['ShippingZone'] = shippingUpdated.count;

    // AuditLogs
    const auditUpdated = await prisma.auditLog.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['AuditLog'] = auditUpdated.count;

    // FeedbackRatings
    const feedbackUpdated = await prisma.feedbackRating.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['FeedbackRating'] = feedbackUpdated.count;

    // EmailUnsubscribes
    const unsubUpdated = await prisma.emailUnsubscribe.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['EmailUnsubscribe'] = unsubUpdated.count;

    // RepairDeviceServices (per-tenant pricing)
    const repairServicesUpdated = await prisma.repairDeviceService.updateMany({
        where: { tenantId: null },
        data: { tenantId: DEFAULT_TENANT_ID }
    });
    tablesWithCounts['RepairDeviceService'] = repairServicesUpdated.count;

    // Summary
    console.log('\n📋 Backfill Summary:');
    console.log('─'.repeat(40));
    for (const [table, count] of Object.entries(tablesWithCounts)) {
        console.log(`  ${table.padEnd(25)} ${count} records`);
    }
    console.log('─'.repeat(40));
    const total = Object.values(tablesWithCounts).reduce((a, b) => a + b, 0);
    console.log(`  Total${' '.repeat(21)} ${total} records`);
    console.log('');
}

async function main() {
    console.log('🚀 Starting multi-tenant migration...\n');

    try {
        await seedDefaultTenant();
        await seedOwnerUser();
        await backfillTenantIds();

        console.log('✅ Multi-tenant migration completed successfully!\n');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
