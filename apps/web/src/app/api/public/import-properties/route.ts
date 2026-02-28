import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tenantId, csv } = body;

        if (!tenantId || !csv) {
            return NextResponse.json({ error: 'Missing tenantId or CSV' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Simple CSV parser (assuming header name,address,zip,city)
        const lines = csv.split('\n').filter((l: string) => l.trim().length > 0);
        if (lines.length < 2) {
            return NextResponse.json({ error: 'CSV must have at least one data row' }, { status: 400 });
        }

        const headers = lines[0].toLowerCase().split(',').map((h: string) => h.trim());
        const dataRows = lines.slice(1);

        const newProperties = dataRows.map((row: string) => {
            const values = row.split(',').map(v => v.trim());
            const prop: any = { tenant_id: tenantId };

            headers.forEach((h, i) => {
                if (h === 'name') prop.name = values[i];
                if (h === 'address') prop.address_line1 = values[i];
                if (h === 'zip') prop.zip = values[i];
                if (h === 'city') prop.city = values[i];
            });

            return prop;
        }).filter((p: any) => p.name);

        const { data, error } = await supabase
            .from('properties')
            .insert(newProperties)
            .select();

        if (error) {
            console.error('[API] Property import error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, count: data.length });
    } catch (error: any) {
        console.error('[API] Property Import Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
