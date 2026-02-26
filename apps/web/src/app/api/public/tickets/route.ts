import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processTicketAi } from '@/lib/ai-service';

export const dynamic = 'force-dynamic';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await request.json();

        console.log('[API] Creating public ticket for property:', body.propertyId);

        // 1. Validate basic required fields
        if (!body.description || !body.propertyId) {
            return NextResponse.json({ error: 'Missing description or propertyId' }, { status: 400 });
        }

        // 2. Fetch Property to get the correct Tenant ID
        const { data: property, error: pError } = await supabase
            .from('properties')
            .select('tenant_id')
            .eq('id', body.propertyId)
            .single();

        if (pError || !property) {
            console.error('[API] Property not found or error:', pError);
            return NextResponse.json({ error: 'Invalid property selection' }, { status: 400 });
        }

        const tenantId = property.tenant_id;
        const referenceCode = `T-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // 3. Insert ticket into Supabase
        const { data: ticket, error } = await supabase
            .from('tickets')
            .insert({
                tenant_id: tenantId,
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

        // 4. Create Audit Log for creation
        await supabase.from('audit_logs').insert({
            tenant_id: tenantId,
            action: 'TICKET_CREATED',
            target_type: 'TICKET',
            target_id: ticket.id,
            metadata_json: { 
                source: 'PUBLIC_PORTAL',
                details: `Ticket created via public portal. Ref: ${referenceCode}`
            }
        });

        // 5. Trigger AI processing asynchronously
        processTicketAi(ticket.id).catch(err => {
            console.error(`[BG AI] Failed for ${ticket.id}:`, err.message);
        });

        return NextResponse.json(ticket);

    } catch (error: any) {
        console.error('[API] Public Ticket Creation Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
