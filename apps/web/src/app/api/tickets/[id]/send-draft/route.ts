import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(process.env.RESEND_API_KEY || 're_... '); // User should set this

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { toEmail, subject, message } = body;

    try {
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

        // 2. Log to Outbound Emails
        await supabase
            .from('outbound_emails')
            .insert({
                ticket_id: id,
                recipient_email: toEmail,
                subject: subject,
                content_text: message,
                sent_at: new Date().toISOString()
            });

        // 3. Create Audit Log
        await supabase
            .from('audit_logs')
            .insert({
                action: 'EMAIL_SENT',
                target_type: 'TICKET',
                target_id: id,
                details: `Email sent to ${toEmail}`
            });

        return NextResponse.json({ success: true, messageId: resendData?.id });

    } catch (error: any) {
        console.error(`[API] Failed to send email for ${id}:`, error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
