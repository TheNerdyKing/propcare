
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const propertyCount = await prisma.property.count();
    const tenantCount = await prisma.tenant.count();
    const properties = await prisma.property.findMany({ take: 5 });
    const tenants = await prisma.tenant.findMany({ take: 5 });
    
    console.log('Property Count:', propertyCount);
    console.log('Tenant Count:', tenantCount);
    console.log('Sample Properties:', JSON.stringify(properties, null, 2));
    console.log('Sample Tenants:', JSON.stringify(tenants, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  });
