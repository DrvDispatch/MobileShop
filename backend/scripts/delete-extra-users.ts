import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUsers() {
    // Users to keep
    const keepEmails = [
        'elyattoutimohamed2009@gmail.com',  // Molarium
        'raoufi.saidmasoom@gmail.com',       // Said Masoom Raoufi
        'naderi@admin.smartphoneservice.be', // Naderi admin
    ];

    // Find users to delete
    const usersToDelete = await prisma.user.findMany({
        where: { email: { notIn: keepEmails } },
        select: { id: true, name: true, email: true }
    });

    console.log('Users to delete:');
    usersToDelete.forEach(u => console.log('-', u.name, '(' + u.email + ')'));

    // Delete them
    const result = await prisma.user.deleteMany({
        where: { email: { notIn: keepEmails } }
    });

    console.log('\nDeleted', result.count, 'users');
    await prisma.$disconnect();
}

deleteUsers().catch(console.error);
