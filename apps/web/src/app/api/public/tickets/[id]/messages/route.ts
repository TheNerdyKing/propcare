import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idOrCode } = await params;
    const { content } = await request.json();

    try {
        const supabase = getSupabase();
        console.log(`[API] Posting message to ticket: ${idOrCode}`);
        
        // Find ticket first to get IDs
        let query = supabase
            .from('tickets')
            .select('id, tenant_id');

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

        if (isUuid) {
            query = query.eq('id', idOrCode);
        } else {
            query = query.eq('reference_code', idOrCode);
        }

        const { data: ticket, error: fetchError } = await query.single();

        if (fetchError || !ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const { data: message, error } = await supabase
            .from('ticket_messages')
            .insert({
                ticket_id: ticket.id,
                tenant_id: ticket.tenant_id,
                sender_type: 'TENANT',
                content: content
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(message);
    } catch (error: any) {
        console.error('[API] Message Post Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
