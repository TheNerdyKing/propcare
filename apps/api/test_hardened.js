const http = require('http');

async function runHardenedTest() {
    console.log('--- PropCare Hardened AI Pipeline Test ---');

    // 1. Create a ticket
    const ticketData = JSON.stringify({
        type: 'DAMAGE_REPORT',
        propertyId: '81c1dccf-40c6-433e-8b6d-1b02515a7af3', // From previous manual seed
        unitLabel: 'Unit 404',
        description: 'Water is leaking from the ceiling in the bathroom. It is starting to flood the floor.',
        tenantName: 'Hardened Test User',
        tenantEmail: 'harden@test.com',
        tenantPhone: '00000000',
        permissionToEnter: true,
        urgency: 'NORMAL'
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/portal/tickets',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(ticketData)
        }
    };

    console.log('1. Submitting ticket (Non-blocking)...');
    const start = Date.now();
    const ticket = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(ticketData);
        req.end();
    });

    const duration = Date.now() - start;
    console.log(`- Ticket created in ${duration}ms (Reference: ${ticket.referenceCode})`);
    console.log(`- Initial Status: ${ticket.status}, Internal: ${ticket.internalStatus}`);

    if (duration > 1500) {
        console.warn('WARNING: Ticket creation took too long. AI might be blocking!');
    } else {
        console.log('SUCCESS: Ticket creation is fast and non-blocking.');
    }

    // 2. Poll for AI result
    console.log('2. Polling for AI analysis (waiting for status AI_READY)...');
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
        attempts++;
        await new Promise(r => setTimeout(r, 2000));

        const currentTicket = await new Promise((resolve) => {
            http.get(`http://localhost:3001/api/portal/tickets/${ticket.referenceCode}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
        });

        console.log(`- Attempt ${attempts}: Status=${currentTicket.status}, Internal=${currentTicket.internalStatus}, Category=${currentTicket.category}`);

        if (currentTicket.status === 'AI_READY') {
            console.log('SUCCESS: AI Analysis completed!');
            console.log('--- Final Ticket Context ---');
            console.log(`- Category: ${currentTicket.category}`);
            console.log(`- Urgency: ${currentTicket.urgency}`);
            break;
        }

        if (currentTicket.status === 'NEEDS_ATTENTION') {
            console.log('RESULT: AI completed with NEEDS_ATTENTION (Fallback triggered).');
            break;
        }
    }
}

runHardenedTest().catch(console.error);
