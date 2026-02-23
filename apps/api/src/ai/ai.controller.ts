import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Request, ForbiddenException } from '@nestjs/common';
import { AiService } from './ai.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('ai')
export class AiController {
    private readonly logger = new Logger(AiController.name);

    constructor(private aiService: AiService) { }

    @Public()
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleSupabaseWebhook(@Body() body: any, @Request() req: any) {
        // Supabase Database Webhook Payload
        // https://supabase.com/docs/guides/database/webhooks

        const { type, table, record, schema } = body;

        this.logger.log(`Received Supabase Webhook: ${type} on ${schema}.${table}`);

        // Simple security check: In production, use a shared secret key in headers
        const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
        const requestSecret = req.headers['x-supabase-webhook-secret'];

        if (webhookSecret && requestSecret !== webhookSecret) {
            this.logger.warn('Unauthorized webhook attempt');
            throw new ForbiddenException('Invalid webhook secret');
        }

        if (table === 'tickets') {
            const ticketId = record?.id || body.old_record?.id;

            // Case 1: New ticket inserted (Auto-analysis)
            if (type === 'INSERT') {
                this.logger.log(`New ticket INSERT detected: ${ticketId}. Triggering AI...`);
                this.aiService.processTicket(ticketId).catch(err => {
                    this.logger.error(`Async AI processing failed for ${ticketId}: ${err.message}`);
                });
                return { handled: true, ticketId, action: 'INSERT_TRIGGER' };
            }

            // Case 2: Manual trigger via status update to AI_PROCESSING
            if (type === 'UPDATE' && record.internal_status === 'AI_PROCESSING') {
                this.logger.log(`Manual AI trigger via UPDATE detected for ticket: ${ticketId}`);
                this.aiService.processTicket(ticketId).catch(err => {
                    this.logger.error(`Async AI processing failed for ${ticketId}: ${err.message}`);
                });
                return { handled: true, ticketId, action: 'UPDATE_TRIGGER' };
            }

            this.logger.warn(`Ticket update ignored for ${ticketId}: type=${type}, status=${record?.internal_status}`);
        } else {
            this.logger.warn(`Webhook ignored: No matching logic for table=${table}, type=${type}`);
        }

        return { handled: false, reason: 'Ignored event type, table, or status' };
    }
}
