import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const tenantName = 'Default Property Management';
    const adminEmail = 'admin@propcare.ch';
    const adminPassword = 'adminpassword123'; // In production, use env or random

    console.log('Seeding database...');

    // Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'default-tenant-uuid' }, // Hardcoding for seed reliability
        update: {},
        create: {
            id: 'default-tenant-uuid',
            name: tenantName,
        },
    });

    // Create Admin User
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: adminEmail,
            },
        },
        update: {},
        create: {
            tenantId: tenant.id,
            email: adminEmail,
            name: 'Global Admin',
            role: Role.ADMIN,
            passwordHash: passwordHash,
        },
    });

    console.log(`Seed completed!`);
    console.log(`Tenant: ${tenant.name} (${tenant.id})`);
    console.log(`Admin User: ${adminEmail}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
