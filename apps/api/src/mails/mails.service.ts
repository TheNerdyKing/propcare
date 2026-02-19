import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailsService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailsService.name);

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT'),
            secure: this.configService.get('SMTP_SECURE') === 'true',
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }

    async sendEmail(to: string, subject: string, body: string) {
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM') || '"PropCare" <no-reply@propcare.ch>',
                to,
                subject,
                text: body,
                html: body.replace(/\n/g, '<br>'), // Simple text to html conversion
            });
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
