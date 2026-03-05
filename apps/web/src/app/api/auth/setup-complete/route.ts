import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email, name } = await req.json();

        await sendEmail({
            to: email,
            subject: 'PropCare: Ihr Konto wurde erfolgreich eingerichtet',
            html: `
                <div style="font-family: sans-serif; padding: 40px; color: #0f172a; background-color: #f8fafc;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 48px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                        <h1 style="font-size: 24px; font-weight: 800; text-transform: uppercase; margin-bottom: 24px; color: #2563eb;">Konto eingerichtet</h1>
                        <p style="font-size: 16px; line-height: 1.6; color: #475569;">Hallo ${name},</p>
                        <p style="font-size: 16px; line-height: 1.6; color: #475569;">Ihr PropCare-Konto wurde erfolgreich initialisiert. Sie haben jetzt vollen Zugriff auf die Plattform mit Ihrer neuen E-Mail-Adresse.</p>
                        
                        <div style="margin-top: 32px; padding: 24px; background: #f1f5f9; border-radius: 16px;">
                            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">E-Mail Adresse</p>
                            <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1e293b;">${email}</p>
                        </div>

                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://propcare.ch'}/dashboard" style="display: inline-block; margin-top: 32px; background: #2563eb; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">Zum Dashboard</a>

                        <p style="margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 24px; font-size: 12px; color: #94a3b8; font-style: italic;">
                            Dies ist eine automatische Bestätigung Ihrer Kontoeinrichtung.
                        </p>
                    </div>
                </div>
            `
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Email API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
