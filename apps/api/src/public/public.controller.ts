import { Controller, Post, Get, Body, Param, Request, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class DiagnosticController {
    constructor(private publicService: PublicService) { }

    @Public()
    @Get()
    root() {
        return { message: 'PropCare API is active', version: '1.0.17' };
    }

    @Public()
    @Post('portal/tickets')
    async createTicket(@Body() createTicketDto: CreateTicketDto) {
        return this.publicService.createTicket(createTicketDto);
    }

    @Public()
    @Get('portal/properties')
    async getProperties() {
        return this.publicService.getProperties();
    }

    @Public()
    @Get('portal/tickets/:referenceCode')
    async getTicketByReference(@Param('referenceCode') referenceCode: string) {
        return this.publicService.getTicketByReference(referenceCode);
    }

    @Public()
    @Post('portal/tickets/:referenceCode/messages')
    async addPublicMessage(
        @Param('referenceCode') referenceCode: string,
        @Body('content') content: string
    ) {
        return this.publicService.addPublicMessage(referenceCode, content);
    }

    @Public()
    @Get('portal/health')
    async health() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.17',
            routes: ['portal/initialize-demo', 'portal/activate-now', 'portal/diagnostics']
        };
    }

    @Public()
    @Get('portal/diagnostics')
    async diagnostics(@Request() req: any) {
        return {
            headers: req.headers,
            user: req.user,
            query: req.query,
            env: process.env.NODE_ENV
        };
    }

    @Public()
    @Post('portal/initialize-demo')
    @Get('portal/initialize-demo')
    @Post('portal/activate-now')
    @Get('portal/activate-now')
    async activateDemo(@Body('tenantId') bodyId: string, @Query('tenantId') queryId: string, @Request() req: any) {
        const tenantId = bodyId || queryId || req.user?.tenantId;

        if (!tenantId) {
            throw new Error('Tenant identification failed. Please provide a tenantId in the URL, e.g., ?tenantId=YOUR_ID');
        }

        console.log(`[DiagnosticController] Activating demo for tenant: ${tenantId}`);
        await this.publicService.seedDemoDataForTenant(tenantId);

        return {
            success: true,
            message: "Demo data successfully seeded.",
            tenantId,
            action: "Please refresh your dashboard."
        };
    }

    // Legacy backup with HTML response for direct browser hits
    @Public()
    @Get('portal/force-activate')
    async forceActivate(@Query('tenantId') tenantId: string) {
        if (!tenantId) return "<h1>Error</h1><p>Missing tenantId in URL. Please use ?tenantId=xyz</p>";
        try {
            await this.publicService.seedDemoDataForTenant(tenantId);
            return `<h1>Success!</h1><p>Demo data seeded for ${tenantId}. <a href='https://propcare.vercel.app/dashboard'>Return to Dashboard</a></p>`;
        } catch (e: any) {
            return `<h1>Error</h1><p>${e.message}</p>`;
        }
    }
}
