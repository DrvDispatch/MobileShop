/**
 * Delete ALL users
 * Run: npx ts-node --transpile-only scripts/delete-users.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔍 Finding all users...\n');

    // Find all users
    const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true }
    });

    console.log('Users to DELETE:');
    allUsers.forEach(u => console.log(`   - ${u.name} (${u.email}) [${u.role}]`));

    if (allUsers.length === 0) {
        console.log('\n✨ No users to delete!');
        return;
    }

    // Delete all users
    console.log('\n🗑️  Deleting all users...');

    const result = await prisma.user.deleteMany({});

    console.log(`\n✅ Deleted ${result.count} users!`);
    console.log('\n📝 You can now register a new account at /register');
}

main()
    .catch((e) => {
        console.error('❌ Failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
