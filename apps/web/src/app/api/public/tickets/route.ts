import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processTicketAi } from '@/lib/ai-service';
import { sendEmail } from '@/lib/email';

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
            .select('tenant_id, name')
            .eq('id', body.propertyId)
            .single();

        if (pError || !property) {
            console.error('[API] Property not found or error:', pError);
            return NextResponse.json({ error: 'Invalid property selection' }, { status: 400 });
        }

        const tenantId = property.tenant_id;
        const referenceCode = `T-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // 3. Insert ticket into Supabase
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
                // Column name mismatch fix: try to use what prisma maps or the SQL says
                // Based on SQL: internal_status. Based on Prisma: ai_status.
                // We'll omit it for now to let it use default, or try to be safe.
                type: body.type || 'DAMAGE_REPORT'
            })
            .select()
            .single();

        if (error) {
            console.error('[API] Supabase Insert Error:', error);
            throw error;
        }

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

        // 5. Send Confirmation Email (New)
        if (body.tenantEmail) {
            const isGeneral = body.type === 'GENERAL_INQUIRY';
            const subject = isGeneral ? 'Eingangsbestätigung: Ihre Anfrage' : 'Eingangsbestätigung: Ihre Schadensmeldung';
            const title = isGeneral ? 'Anfrage erhalten' : 'Meldung erhalten';
            
            await sendEmail({
                to: body.tenantEmail,
                subject: `${subject} (${referenceCode})`,
                body: `Hallo ${body.tenantName},\n\nwir haben Ihr Anliegen für die Liegenschaft ${property.name} erhalten.\n\nReferenzcode: ${referenceCode}\nStatus: NEU\n\nWir werden uns umgehend mit Ihnen in Verbindung setzen.\n\nIhr PropCare Team`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2 style="color: #2563eb;">${title}</h2>
                        <p>Hallo ${body.tenantName},</p>
                        <p>vielen Dank für Ihre Nachricht bezüglich der Liegenschaft <b>${property.name}</b>.</p>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0;"><b>Referenzcode:</b> ${referenceCode}</p>
                            <p style="margin: 0;"><b>Status:</b> NEU</p>
                        </div>
                        <p>Wir haben Ihr Anliegen erfasst und werden es so schnell wie möglich bearbeiten.</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="color: #64748b; font-size: 12px;">Dies ist eine automatisch generierte Nachricht von PropCare.</p>
                    </div>
                `
            });
        }

        // 6. Trigger AI processing asynchronously
        processTicketAi(ticket.id).catch(err => {
            console.error(`[BG AI] Failed for ${ticket.id}:`, err.message);
        });

        return NextResponse.json(ticket);

    } catch (error: any) {
        console.error('[API] Public Ticket Creation Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
