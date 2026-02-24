import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ referenceCode: string }> }
) {
    const { referenceCode } = await params;

    try {
        console.log(`[API] Fetching public ticket: ${referenceCode}`);
        const { data, error } = await supabase
            .from('tickets')
            .select('*, property:properties(name, city, zip), messages:ticket_messages(*)')
            .eq('reference_code', referenceCode)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Map snake_case to camelCase if needed by frontend, 
        // but modern JS handles both. We'll return raw for now.
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ referenceCode: string }> }
) {
    const { referenceCode } = await params;
    const { content } = await request.json();

    try {
        console.log(`[API] Posting message to public ticket: ${referenceCode}`);
        // Find ticket first to get IDs
        const { data: ticket } = await supabase
            .from('tickets')
            .select('id, tenant_id')
            .eq('reference_code', referenceCode)
            .single();

        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
