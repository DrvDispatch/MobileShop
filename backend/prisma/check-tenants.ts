
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    const tenants = await prisma.tenant.findMany({
        include: { domains: true }
    });
    console.log('Tenants found:', tenants.length);
    tenants.forEach(t => {
        console.log(`- ${t.name} (${t.id})`);
        t.domains.forEach(d => console.log(`  Domain: ${d.domain} (Primary: ${d.isPrimary})`));
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
