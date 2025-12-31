// Fix OWNER user - ensure correct tenantId and password
// Run with: npx tsx prisma/fix-owner-user.ts

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});

async function fixOwnerUser() {
    console.log('🔧 Fixing OWNER user...\n');

    // Find OWNER user
    const owner = await prisma.user.findFirst({
        where: { email: 'owner@servicepulse.com' }
    });

    if (!owner) {
        console.log('❌ OWNER user not found. Creating new one...');

        // Hash password: "OwnerPass123!"
        const passwordHash = await bcrypt.hash('OwnerPass123!', 12);

        const newOwner = await prisma.user.create({
            data: {
                tenantId: null,
                email: 'owner@servicepulse.com',
                name: 'Platform Owner',
                role: 'OWNER',
                passwordHash,
                emailVerified: new Date(),
                isActive: true,
            }
        });

        console.log('✅ OWNER user created:', newOwner.email);
        console.log('   Password: OwnerPass123!');
        return;
    }

    console.log('📋 Current OWNER user:');
    console.log('   Email:', owner.email);
    console.log('   Role:', owner.role);
    console.log('   TenantId:', owner.tenantId);
    console.log('   Active:', owner.isActive);
    console.log('');

    // Fix tenantId if needed
    if (owner.tenantId !== null) {
        console.log('⚠️  OWNER has tenantId, fixing to null...');
        await prisma.user.update({
            where: { id: owner.id },
            data: { tenantId: null }
        });
        console.log('✅ TenantId set to null');
    }

    // Update password to "OwnerPass123!"
    console.log('🔑 Updating password to: OwnerPass123!');
    const passwordHash = await bcrypt.hash('OwnerPass123!', 12);

    await prisma.user.update({
        where: { id: owner.id },
        data: {
            passwordHash,
            isActive: true,
            emailVerified: owner.emailVerified || new Date()
        }
    });

    console.log('✅ OWNER user fixed successfully!\n');
    console.log('📝 Login credentials:');
    console.log('   Email: owner@servicepulse.com');
    console.log('   Password: OwnerPass123!');
}

async function main() {
    try {
        await fixOwnerUser();
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
