import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const orders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
    });

    const output = orders.map(order => ({
        orderNumber: order.orderNumber,
        id: order.id,
        status: order.status,
        total: order.total,
        customerEmail: order.customerEmail,
        paidAt: order.paidAt ? order.paidAt.toISOString() : null,
        stripeSessionId: order.stripeSessionId,
        stripePaymentIntentId: order.stripePaymentIntentId,
        createdAt: order.createdAt.toISOString(),
    }));

    fs.writeFileSync('orders-debug.json', JSON.stringify(output, null, 2));
    console.log('Written to orders-debug.json');
    console.log(JSON.stringify(output, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
