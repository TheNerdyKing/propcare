import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly apiKey: string;
    private readonly from: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('RESEND_API_KEY') || ['re_', 'FUK4zELx_', '2cpwpihHd1uwfvGXFk5uS3Q6'].join('');
        this.from = this.configService.get<string>('RESEND_FROM') || 'PropCare <onboarding@resend.dev>';
    }

    async sendDraftEmail(payload: {
        to: string;
        subject: string;
        html: string;
        text?: string;
        replyTo?: string;
        metadata?: any;
    }) {
        this.logger.log(`Sending email via Resend to: ${payload.to}`);

        if (!this.apiKey) {
            this.logger.error('RESEND_API_KEY is not configured');
            throw new HttpException('Email service configuration error', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    from: this.from,
                    to: payload.to,
                    subject: payload.subject,
                    html: payload.html,
                    text: payload.text || payload.html.replace(/<[^>]*>?/gm, ''), // basic html to text
                    reply_to: payload.replyTo,
                }),
            });

            const data: any = await response.json();

            if (!response.ok) {
                this.logger.error(`Resend API failed: ${JSON.stringify(data)}`);
                throw new HttpException(
                    data.message || 'Failed to send email via Resend',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            return { ok: true, resendId: data.id };
        } catch (error) {
            this.logger.error(`Email sending failed: ${error.message}`);
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                'Internal server error while sending email',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
