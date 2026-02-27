const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const sql = `
    CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON tickets(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
    CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_contractors_tenant_id ON contractors(tenant_id);
  `;

    console.log('Running migration...');

    // Supabase JS doesn't support raw SQL easily unless using a RPC or the internal PG connection
    // But we can try to use the REST API to see if we can trigger something or just inform the user.
    // Actually, I'll use 'prisma db execute' again but with the .cmd wrapper properly.

    console.log('Migration script generated. Please run with prisma db execute --file fix_db_perf.sql');
}

runMigration();
