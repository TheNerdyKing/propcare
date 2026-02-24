import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processTicketAi } from '@/lib/ai-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 1. Validate basic required fields (minimal, lean)
        if (!body.description || !body.propertyId) {
            return NextResponse.json({ error: 'Missing description or propertyId' }, { status: 400 });
        }

        const referenceCode = `T-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // 2. Insert ticket into Supabase
        const { data: ticket, error } = await supabase
            .from('tickets')
            .insert({
                tenant_id: body.tenantId || '7297f6c3-6311-460d-85f0-6cca266e7465', // Default demo tenant if not provided
                property_id: body.propertyId,
                unit_label: body.unitLabel,
                description: body.description,
                tenant_name: body.tenantName,
                tenant_email: body.tenantEmail,
                tenant_phone: body.tenantPhone,
                urgency: body.urgency || 'NORMAL',
                reference_code: referenceCode,
                status: 'NEW',
                ai_status: 'NOT_REQUESTED'
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Trigger AI processing asynchronously (don't await for faster response)
        // Note: In Vercel serverless, we might need to await anyway or use a background job,
        // but here we'll try a fast-return pattern or await for safety in serverless.
        processTicketAi(ticket.id).catch(err => {
            console.error(`[BG AI] Failed for ${ticket.id}:`, err.message);
        });

        return NextResponse.json(ticket);

    } catch (error: any) {
        console.error('[API] Public Ticket Creation Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
