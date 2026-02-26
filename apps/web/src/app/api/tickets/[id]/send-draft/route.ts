import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

function getClients() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey || 're_... ');

    return { supabase, resend };
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { toEmail, subject, message } = body;

    try {
        const { supabase, resend } = getClients();
        console.log(`[API] Sending contractor email for ticket ${id} to ${toEmail}`);

        // 1. Send Email via Resend
        const { data: resendData, error: resendError } = await resend.emails.send({
            from: 'PropCare <onboarding@resend.dev>', // Should be a verified domain in production
            to: [toEmail],
            subject: subject || 'Maintenance Request',
            text: message,
            html: `<div>${message.replace(/\n/g, '<br/>')}</div>`,
        });

        if (resendError) throw resendError;

        // Fetch ticket to get tenant_id for logging
        const { data: ticket } = await supabase.from('tickets').select('tenant_id').eq('id', id).single();

        if (ticket) {
            // 2. Log to Outbound Emails (matching schema fields: to_email, body)
            await supabase
                .from('outbound_emails')
                .insert({
                    tenant_id: ticket.tenant_id,
                    ticket_id: id,
                    to_email: toEmail,
                    subject: subject || 'No Subject',
                    body: message,
                    status: 'SENT'
                });

            // 3. Create Audit Log (removing non-existent 'details' field)
            await supabase
                .from('audit_logs')
                .insert({
                    tenant_id: ticket.tenant_id,
                    action: 'EMAIL_SENT',
                    target_type: 'TICKET',
                    target_id: id,
                    metadata_json: { 
                        to: toEmail, 
                        subject,
                        details: `E-Mail an ${toEmail} gesendet.`
                    }
                });
        }

        return NextResponse.json({ success: true, messageId: resendData?.id });

    } catch (error: any) {
        console.error(`[API] Failed to send email for ${id}:`, error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
