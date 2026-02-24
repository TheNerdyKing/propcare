
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Try to read env from various places
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Env not in process.env, trying to find .env file...');
    const paths = ['apps/web/.env.local', 'apps/web/.env', '.env'];
    for (const p of paths) {
        if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf8');
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
                if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
                if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) if (!supabaseKey) supabaseKey = line.split('=')[1].trim();
            }
            if (supabaseUrl && supabaseKey) break;
        }
    }
}

console.log('Using URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: properties, error: pError } = await supabase.from('properties').select('id, name, tenant_id').limit(10);
    if (pError) console.error('Property Error:', pError);
    else console.log('Properties:', properties);

    const { data: tenants, error: tError } = await supabase.from('tenants').select('id, name');
    if (tError) console.error('Tenant Error:', tError);
    else console.log('Tenants:', tenants);
}

checkData();
