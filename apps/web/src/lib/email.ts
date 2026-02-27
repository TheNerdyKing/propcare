import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_FUK4zELx_2cpwpihHd1uwfvGXFk5uS3Q6');
const FROM_EMAIL = process.env.RESEND_FROM || 'PropCare <onboarding@resend.dev>';

export async function sendEmail({ to, subject, body, html }: { to: string | string[], subject: string, body?: string, html?: string }) {
    const isSandbox = (process.env.RESEND_SANDBOX === 'true') || !process.env.RESEND_FROM?.includes('@');

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: Array.isArray(to) ? to : [to],
            subject: subject,
            text: body || (html ? html.replace(/<[^>]*>?/gm, '') : ''),
            html: html || `<div>${body?.replace(/\n/g, '<br/>')}</div>`,
        });

        if (error) {
            console.error('[Email] Failed to send:', error);
            
            // Simulation for Buyer Demo / Sandbox
            if (isSandbox) {
                console.warn('[Email] SANDBOX MOCK: Simulating success despite error:', error.message);
                return { success: true, simulated: true };
            }

            return { success: false, error };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('[Email] Exception:', err);
        
        if (isSandbox) {
            console.warn('[Email] SANDBOX MOCK: Simulating success despite exception.');
            return { success: true, simulated: true };
        }

        return { success: false, error: err.message };
    }
}
