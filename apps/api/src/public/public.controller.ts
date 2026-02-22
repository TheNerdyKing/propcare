import { Controller, Post, Get, Body, Param, Request, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('portal')
export class PublicController {
    constructor(private publicService: PublicService) { }

    @Public()
    @Post('tickets')
    async createTicket(@Body() createTicketDto: CreateTicketDto) {
        return this.publicService.createTicket(createTicketDto);
    }

    @Public()
    @Get('properties')
    async getProperties() {
        return this.publicService.getProperties();
    }

    @Public()
    @Get('tickets/:referenceCode')
    async getTicketByReference(@Param('referenceCode') referenceCode: string) {
        return this.publicService.getTicketByReference(referenceCode);
    }

    @Public()
    @Post('tickets/:referenceCode/messages')
    async addPublicMessage(
        @Param('referenceCode') referenceCode: string,
        @Body('content') content: string
    ) {
        return this.publicService.addPublicMessage(referenceCode, content);
    }

    @Public()
    @Get('health')
    async health() {
        return { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.13' };
    }

    @Public()
    @Post('initialize-demo')
    async activateDemo(@Body('tenantId') tenantId: string, @Request() req: any) {
        // Fallback to token-based tenantId if not provided in body
        const effectiveTenantId = tenantId || req.user?.tenantId;
        if (!effectiveTenantId) {
            // In a completely permissive mode, we might want to log this but keep going if possible.
            // For now, we still need a tenantId to know where to put the data.
            throw new Error('Tenant identification failed. Please provide a tenantId or valid session.');
        }
        return this.publicService.seedDemoDataForTenant(effectiveTenantId);
    }

    // Emergency GET route for activation if POST is blocked by proxy/firewall
    @Public()
    @Get('activate-now')
    async activateNow(@Query('tenantId') tenantId: string) {
        if (!tenantId) return "Error: Missing tenantId in URL.";
        try {
            await this.publicService.seedDemoDataForTenant(tenantId);
            return "<h1>Success!</h1><p>Demo data has been seeded. You can <a href='javascript:window.close()'>close this tab</a> and refresh your dashboard.</p>";
        } catch (e: any) {
            return `<h1>Error</h1><p>${e.message}</p>`;
        }
    }
}
