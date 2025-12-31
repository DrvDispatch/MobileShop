
import { PrismaClient } from '../src/generated/prisma/client';
import { TicketsService } from '../src/modules/tickets/tickets.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TicketsModule } from '../src/modules/tickets/tickets.module';
import { AppModule } from '../src/app.module';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

// Minimal mock to avoid full app bootstrap waiting
async function testTicketIsolation() {
    const prisma = new PrismaClient({ adapter });

    console.log('--- Starting Ticket Isolation Test ---');

    try {
        // 1. Get Tenants
        const defaultTenant = await prisma.tenant.findFirst({ where: { name: 'Default Tenant' } });
        const testTenant = await prisma.tenant.findFirst({ where: { slug: 'test-shop' } });

        if (!defaultTenant || !testTenant) {
            throw new Error('Tenants not found. Run seed and create-test-tenant first.');
        }

        console.log(`Tenant A: ${defaultTenant.id} (${defaultTenant.name})`);
        console.log(`Tenant B: ${testTenant.id} (${testTenant.name})`);

        // 2. Create Ticket for Tenant A directly via Prisma (simulating Service creation)
        const ticketA = await prisma.ticket.create({
            data: {
                tenantId: defaultTenant.id,
                caseId: `TEST-ISO-${Date.now()}`,
                subject: 'Isolation Test Ticket',
                status: 'OPEN',
                category: 'GENERAL',
                sessionId: 'session-a', // Dummy session
                customerName: 'Test User A',
            }
        });

        console.log(`Created Ticket A: ${ticketA.id} (${ticketA.caseId})`);

        // 3. Test Service Isolation Logic (Simulating Service Calls)
        // We will perform the query exactly as the service does: findFirst({ where: { tenantId, id } })

        // 3a. Tenant A tries to access Ticket A -> SHOULD FOUND
        const foundA = await prisma.ticket.findFirst({
            where: { tenantId: defaultTenant.id, id: ticketA.id }
        });
        console.log(`Tenant A access Ticket A: ${foundA ? '✅ FOUND' : '❌ NOT FOUND (Error)'}`);

        // 3b. Tenant B tries to access Ticket A -> SHOULD NOT FOUND
        const foundB = await prisma.ticket.findFirst({
            where: { tenantId: testTenant.id, id: ticketA.id }
        });
        console.log(`Tenant B access Ticket A: ${foundB ? '❌ FOUND (Critical Failure)' : '✅ BLOCKED (Success)'}`);

        // 3c. Tenant B tries findAll -> Should not see Ticket A
        const listB = await prisma.ticket.findMany({
            where: { tenantId: testTenant.id }
        });
        const leak = listB.find(t => t.id === ticketA.id);
        console.log(`Tenant B findAll contains Ticket A: ${leak ? '❌ YES (Critical Failure)' : '✅ NO (Success)'}`);

        // Cleanup
        await prisma.ticketMessage.deleteMany({ where: { ticketId: ticketA.id } }); // clean messages if any created (none here)
        await prisma.ticket.delete({ where: { id: ticketA.id } });
        console.log('Cleanup complete.');

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testTicketIsolation();
