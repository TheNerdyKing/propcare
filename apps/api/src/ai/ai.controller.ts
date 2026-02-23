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

        if (table === 'tickets' && type === 'INSERT') {
            const ticketId = record.id;
            this.logger.log(`Triggering AI processing for ticket: ${ticketId}`);

            // We start processing asynchronously
            this.aiService.processTicket(ticketId).catch(err => {
                this.logger.error(`Async AI processing failed for ${ticketId}: ${err.message}`);
            });

            return { handled: true, ticketId };
        }

        return { handled: false, reason: 'Ignored event type or table' };
    }
}
