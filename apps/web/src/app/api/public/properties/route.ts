import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET() {
    try {
        const supabase = getSupabase();
        console.log('[API] Fetching public properties...');
        
        // 1. Get the first tenant (default demo tenant)
        const { data: tenant, error: tError } = await supabase
            .from('tenants')
            .select('id')
            .limit(1)
            .single();

        if (tError || !tenant) {
            console.warn('[API] No tenant found for public portal');
            return NextResponse.json([]);
        }

        const { data, error } = await supabase
            .from('properties')
            .select('id, name')
            .eq('tenant_id', tenant.id)
            .order('name');

        if (error) {
            console.error('[API] Property fetch error:', error);
            throw error;
        }
        console.log(`[API] Found ${data?.length || 0} properties`);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Public Properties Fetch Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
