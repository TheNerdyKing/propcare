const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    const tenantId = 'default-tenant-uuid';

    await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: { id: tenantId, name: 'PropCare Demo' }
    });

    const prop = await prisma.property.upsert({
        where: { id: '81c1dccf-40c6-433e-8b6d-1b02515a7af3' },
        update: { zip: '8001', city: 'Zurich' },
        create: {
            id: '81c1dccf-40c6-433e-8b6d-1b02515a7af3',
            tenantId: tenantId,
            name: 'Hardened Towers',
            addressLine1: 'Security Way 1',
            zip: '8001',
            city: 'Zurich',
            country: 'CH'
        }
    });

    // Create an internal contractor for PLUMBING in Zurich
    await prisma.contractor.upsert({
        where: { id: 'contractor-plumb-1' },
        update: {
            tradeTypes: ['PLUMBING'],
            serviceZipCodes: ['8001'],
            serviceCities: ['Zurich']
        },
        create: {
            id: 'contractor-plumb-1',
            tenantId: tenantId,
            name: 'ZuriPlumb GmbH',
            email: 'info@zuriplumb.demo',
            tradeTypes: ['PLUMBING'],
            serviceZipCodes: ['8001'],
            serviceCities: ['Zurich']
        }
    });

    console.log('Seed successful. Property and Internal Contractor ready.');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
