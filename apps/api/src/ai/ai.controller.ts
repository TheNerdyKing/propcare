import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Request, ForbiddenException, Param } from '@nestjs/common';
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

            // Manual trigger via status update to PROCESSING (Manual Click or Event)
            if (type === 'UPDATE' && record.ai_status === 'PROCESSING') {
                this.logger.log(`Manual AI trigger via UPDATE detected for ticket: ${ticketId}`);
                try {
                    await this.aiService.processTicket(ticketId);
                } catch (err) {
                    this.logger.error(`AI processing failed for ${ticketId}: ${err.message}`);
                }
                return { handled: true, ticketId, action: 'UPDATE_TRIGGER' };
            }

            this.logger.warn(`Ticket update ignored for ${ticketId}: type=${type}, status=${record?.ai_status}`);
        } else {
            this.logger.warn(`Webhook ignored: No matching logic for table=${table}, type=${type}`);
        }

        return { handled: false, reason: 'Ignored event type, table, or status' };
    }

    @Post(':id/analyze')
    async manualAnalyze(@Param('id') id: string, @Request() req: any) {
        this.logger.log(`Direct AI analysis requested via API for ticket: ${id}`);

        // userId from JWT if available
        const userId = req.user?.id;

        try {
            await this.aiService.processTicket(id, userId);
            return { success: true, ticketId: id };
        } catch (err) {
            this.logger.error(`Manual AI analysis failed for ${id}: ${err.message}`);
            throw err;
        }
    }

    @Public()
    @Post('test')
    @HttpCode(HttpStatus.OK)
    async testAnalysis(@Body() body: any) {
        this.logger.log('AI Isolation Test Requested');
        try {
            // This expects a ticket-like object in the body
            const result = await this.aiService.analyzeRawData(body);
            return result;
        } catch (err) {
            this.logger.error(`AI Isolation Test Failed: ${err.message}`);
            return { error: err.message };
        }
    }
}
