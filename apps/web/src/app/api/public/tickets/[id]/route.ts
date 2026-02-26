import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = getSupabase();
        const idOrRef = id;

        console.log('[API] Fetching ticket by ID or Ref:', idOrRef);

        let query = supabase
            .from('tickets')
            .select(`
                *,
                property:properties(name),
                messages:ticket_messages(*),
                results:ai_results(*)
            `);

        // Check if idOrRef is a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrRef);

        if (isUuid) {
            query = query.eq('id', idOrRef);
        } else {
            query = query.eq('reference_code', idOrRef);
        }

        const { data: ticket, error } = await query.single();

        if (error || !ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        return NextResponse.json(ticket);

    } catch (error: any) {
        console.error('[API] Ticket Fetch Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
