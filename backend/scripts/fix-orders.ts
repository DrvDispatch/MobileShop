import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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
        take: 10,
    });

    console.log(`Found ${orders.length} orders:\n`);

    for (const order of orders) {
        console.log(`Order: ${order.orderNumber}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Total: €${order.total}`);
        console.log(`  Customer: ${order.customerName} (${order.customerEmail})`);
        console.log(`  Items: ${order.items.map(i => i.productName).join(', ')}`);
        console.log(`  Created: ${order.createdAt}`);
        console.log('---');
    }

    // Find pending orders and mark them as PAID (for testing)
    const pendingOrders = orders.filter(o => o.status === 'PENDING');

    if (pendingOrders.length > 0) {
        console.log(`\n⚠️ Found ${pendingOrders.length} PENDING order(s).`);
        console.log('Updating to PAID status...\n');

        for (const order of pendingOrders) {
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'PAID',
                    paidAt: new Date(),
                },
            });
            console.log(`✅ Updated order ${order.orderNumber} to PAID`);
        }
    }

    console.log('\n✅ Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
