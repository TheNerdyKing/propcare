import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function getSupabase(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create client with service key OR anon key
    const client = createClient(supabaseUrl, supabaseKey);

    // If we have an auth header from the user, attach it
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
        // Technically creates a new client but works for this scope
        return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
            global: {
                headers: {
                    Authorization: authHeader
                }
            }
        });
    }

    return client;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { toEmail, subject, message } = body;

    try {
        const supabase = getSupabase(request);
        console.log(`[API] Sending contractor email for ticket ${id} to ${toEmail}`);

        if (!toEmail || !message) {
            return NextResponse.json({ success: false, error: 'Recipient email and message are required' }, { status: 400 });
        }

        // 1. Send Email via shared utility
        const emailResult = await sendEmail({
            to: toEmail,
            subject: subject || 'Maintenance Request',
            body: message,
        });

        if (!emailResult.success) {
            throw new Error(emailResult.error as string);
        }

        // Fetch ticket to get tenant_id for logging
        const { data: ticket } = await supabase.from('tickets').select('tenant_id').eq('id', id).single();

        if (ticket) {
            // 2. Log to Outbound Emails
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

            // 3. Create Audit Log
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

            // 4. Update Ticket status to SENT
            await supabase
                .from('tickets')
                .update({ status: 'SENT' })
                .eq('id', id);
        }

        return NextResponse.json({ success: true, messageId: (emailResult.data as any)?.id });

    } catch (error: any) {
        console.error(`[API] Failed to send email for ${id}:`, error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
