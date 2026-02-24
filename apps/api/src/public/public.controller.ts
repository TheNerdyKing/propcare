import { Controller, Post, Get, Body, Param, Request, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('public')
export class PublicController {
    constructor(private publicService: PublicService) { }

    @Public()
    @Get('health')
    health() {
        return { status: 'ok', version: '2.0.0' };
    }

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
    @Get('status/:referenceCode')
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
    @Get('diagnostics')
    async diagnostics(@Request() req: any) {
        return {
            headers: req.headers,
            query: req.query,
            env: process.env.NODE_ENV
        };
    }
}
