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
            version: '1.0.18',
            routes: ['portal/diagnostics']
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


}
