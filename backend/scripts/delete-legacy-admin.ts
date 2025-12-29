import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.user.deleteMany({
        where: { email: 'admin@mobileshop.com' }
    });
    console.log(`✅ Deleted ${deleted.count} user(s) with email admin@mobileshop.com`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
