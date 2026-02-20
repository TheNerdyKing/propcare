import { PrismaClient, Role, TicketStatus, TicketType, Urgency } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const tenantName = 'Default Property Management';
    const adminEmail = 'admin@propcare.ch';
    const adminPassword = 'adminpassword123';

    console.log('Seeding database...');

    // Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'default-tenant-uuid' },
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

    // Create Properties
    const property1 = await prisma.property.upsert({
        where: { id: 'prop-1' },
        update: {},
        create: {
            id: 'prop-1',
            tenantId: tenant.id,
            name: 'Seaside Apartments',
            addressLine1: 'Marina Drive 101',
            zip: '8000',
            city: 'Zurich',
        },
    });

    const property2 = await prisma.property.upsert({
        where: { id: 'prop-2' },
        update: {},
        create: {
            id: 'prop-2',
            tenantId: tenant.id,
            name: 'Mountain View Complex',
            addressLine1: 'Alpine Way 42',
            zip: '6000',
            city: 'Lucerne',
        },
    });

    // Create Units
    await prisma.unit.upsert({
        where: { id: 'unit-1' },
        update: {},
        create: {
            id: 'unit-1',
            tenantId: tenant.id,
            propertyId: property1.id,
            unitLabel: 'Apt 4B',
        },
    });

    await prisma.unit.upsert({
        where: { id: 'unit-2' },
        update: {},
        create: {
            id: 'unit-2',
            tenantId: tenant.id,
            propertyId: property2.id,
            unitLabel: 'Flat 12',
        },
    });

    // Create Contractors
    const contractor1 = await prisma.contractor.upsert({
        where: { id: 'cont-1' },
        update: {},
        create: {
            id: 'cont-1',
            tenantId: tenant.id,
            name: 'Fast Plumbers Ltd',
            email: 'contact@fastplumbers.ch',
            tradeTypes: ['Plumbing', 'Heating'],
        },
    });

    // Create Tickets
    await prisma.ticket.upsert({
        where: { referenceCode: 'TKT-2024-001' },
        update: {},
        create: {
            tenantId: tenant.id,
            referenceCode: 'TKT-2024-001',
            type: TicketType.DAMAGE_REPORT,
            status: TicketStatus.NEW,
            propertyId: property1.id,
            unitLabel: 'Apt 4B',
            description: 'Water leak under the kitchen sink.',
            tenantName: 'John Doe',
            tenantEmail: 'john.doe@example.com',
            urgency: Urgency.URGENT,
        },
    });

    await prisma.ticket.upsert({
        where: { referenceCode: 'TKT-2024-002' },
        update: {},
        create: {
            tenantId: tenant.id,
            referenceCode: 'TKT-2024-002',
            type: TicketType.DAMAGE_REPORT,
            status: TicketStatus.IN_PROGRESS,
            propertyId: property2.id,
            unitLabel: 'Flat 12',
            description: 'Broken window in the living room.',
            tenantName: 'Jane Smith',
            tenantEmail: 'jane.smith@example.com',
            urgency: Urgency.NORMAL,
        },
    });

    await prisma.ticket.upsert({
        where: { referenceCode: 'TKT-2024-003' },
        update: {},
        create: {
            tenantId: tenant.id,
            referenceCode: 'TKT-2024-003',
            type: TicketType.DAMAGE_REPORT,
            status: TicketStatus.COMPLETED,
            propertyId: property1.id,
            unitLabel: 'Apt 2A',
            description: 'Beeping smoke detector battery replacement.',
            tenantName: 'Alice Johnson',
            tenantEmail: 'alice.j@example.com',
            urgency: Urgency.NORMAL,
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
