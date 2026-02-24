const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const t = await prisma.ticket.findFirst({
        where: { referenceCode: 'PC-B1J4886RB' },
        include: { aiResults: true }
    });
    console.log(JSON.stringify(t, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
