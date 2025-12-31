// Script to create test tenant for multi-tenant isolation verification
// Run with: npx tsx prisma/create-test-tenant.ts

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

// Create Prisma client with PrismaPg adapter
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});

async function createTestTenant() {
    console.log('🏗️  Creating test tenant for isolation verification...\n');

    // Create a second tenant
    const testTenant = await prisma.tenant.upsert({
        where: { slug: 'test-shop' },
        update: {},
        create: {
            name: 'Test Shop',
            slug: 'test-shop',
            status: 'ACTIVE',
        },
    });
    console.log(`✅ Created tenant: ${testTenant.name} (${testTenant.id})`);

    // Add domain for this tenant
    await prisma.tenantDomain.upsert({
        where: { domain: 'testshop.localhost' },
        update: { tenantId: testTenant.id },
        create: {
            tenantId: testTenant.id,
            domain: 'testshop.localhost',
            isPrimary: true,
        },
    });
    console.log(`✅ Added domain: testshop.localhost`);

    // Create tenant config
    await prisma.tenantConfig.upsert({
        where: { tenantId: testTenant.id },
        update: {},
        create: {
            tenantId: testTenant.id,
            shopName: 'Test Shop',
            email: 'test@testshop.localhost',
            phone: '+32 000 000 000',
            primaryColor: '#FF0000',
            secondaryColor: '#00FF00',
        },
    });
    console.log(`✅ Created tenant config`);

    // Create ONE product for the test tenant
    const testProduct = await prisma.product.create({
        data: {
            tenantId: testTenant.id,
            name: 'TEST PRODUCT - ISOLATION CHECK',
            slug: 'test-product-isolation-check',
            price: 999.99,
            stockQty: 1,
            isActive: true,
            isFeatured: true,
            condition: 'NEW',
            productType: 'PHONE',
        },
    });
    console.log(`✅ Created test product: ${testProduct.name} (${testProduct.id})`);

    // Create ONE appointment for the test tenant
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const testAppointment = await prisma.appointment.create({
        data: {
            tenantId: testTenant.id,
            customerName: 'Isolation Test Customer',
            customerEmail: 'isolation@test.com',
            customerPhone: '+32 000 000 001',
            deviceBrand: 'Test',
            deviceModel: 'Isolation Check',
            repairType: 'SCREEN',
            appointmentDate: tomorrow,
            timeSlot: '11:00',
            status: 'CONFIRMED',
        },
    });
    console.log(`✅ Created test appointment: ${testAppointment.id}`);

    console.log('\n📊 Summary:');
    console.log(`   Tenant ID: ${testTenant.id}`);
    console.log(`   Domain: testshop.localhost`);
    console.log(`   Product: TEST PRODUCT - ISOLATION CHECK`);
    console.log(`   Appointment: ${tomorrow.toISOString().split('T')[0]} at 11:00`);

    console.log('\n🧪 To test isolation:');
    console.log('   1. Add to hosts file: 127.0.0.1 testshop.localhost');
    console.log('   2. Visit http://testshop.localhost:3001/api/products');
    console.log('   3. Should see ONLY "TEST PRODUCT - ISOLATION CHECK"');
    console.log('   4. Visit http://localhost:3001/api/products');
    console.log('   5. Should NOT see the test product');
}

createTestTenant()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
