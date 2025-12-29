import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🗑️ Deleting old admin and staff users...');

    // Delete all users with ADMIN or STAFF role
    const result = await prisma.user.deleteMany({
        where: {
            role: {
                in: ['ADMIN', 'STAFF'],
            },
        },
    });

    console.log(`✅ Deleted ${result.count} admin/staff users`);
    console.log('');
    console.log('📋 The super admin "Nader" with password "Naderi123!" is hardcoded');
    console.log('   and not stored in the database. Login via /admin/login');
}

main()
    .catch((e) => {
        console.error('❌ Failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
