import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('📦 Fetching all orders...\n');

    const orders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${orders.length} orders:\n`);

    for (const order of orders) {
        console.log(`\n=== Order: ${order.orderNumber} ===`);
        console.log(`  ID: ${order.id}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Total: €${order.total}`);
        console.log(`  Customer: ${order.customerName} (${order.customerEmail})`);
        console.log(`  Items: ${order.items.map(i => i.productName).join(', ')}`);
        console.log(`  PaidAt: ${order.paidAt || 'NOT PAID'}`);
        console.log(`  StripeSessionId: ${order.stripeSessionId || 'NONE'}`);
        console.log(`  StripePaymentIntentId: ${order.stripePaymentIntentId || 'NONE'}`);
        console.log(`  Created: ${order.createdAt}`);
    }

    console.log('\n\n✅ Done');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
