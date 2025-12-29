import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    // Test order IDs from the database
    const orderId = 'b3a8d35d-2b68-4721-b2c9-d634b201dd02'; // ND-MJO6J4VB-REIX

    console.log(`Attempting to update order ${orderId} to PAID...`);

    try {
        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'PAID',
                stripePaymentIntentId: 'test_payment_intent',
                paidAt: new Date(),
            },
            include: { items: true },
        });

        console.log('✅ Order updated successfully!');
        console.log(`  Order Number: ${order.orderNumber}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  PaidAt: ${order.paidAt}`);
        console.log(`  Items: ${order.items.length}`);
    } catch (error) {
        console.error('❌ Error updating order:');
        console.error(error);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
