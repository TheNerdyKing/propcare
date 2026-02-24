const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const result = await prisma.aiResult.findFirst({
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(result, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
