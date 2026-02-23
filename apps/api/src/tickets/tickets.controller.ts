import { Controller, Get, Post, Patch, Param, Body, Query, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketStatus } from '@prisma/client';

@Controller('tickets')
export class TicketsController {
    constructor(private ticketsService: TicketsService) { }

    @Get()
    async findAll(
        @Request() req: any,
        @Query('status') status?: TicketStatus,
        @Query('search') search?: string,
        @Query('propertyId') propertyId?: string,
    ) {
        return this.ticketsService.findAll(req.user.tenantId, { status, search, propertyId });
    }

    @Post('reprocess')
    async reprocessTicket(@Request() req: any, @Body('ticketId') ticketId: string) {
        return this.ticketsService.reprocessAi(req.user.tenantId, ticketId);
    }

    @Get(':id')
    async findOne(@Request() req: any, @Param('id') id: string) {
        return this.ticketsService.findOne(req.user.tenantId, id);
    }

    @Patch(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        return this.ticketsService.update(req.user.tenantId, id, data, req.user.id);
    }

    @Post(':id/send-email')
    async sendEmail(
        @Request() req: any,
        @Param('id') id: string,
        @Body('to') to: string,
        @Body('subject') subject: string,
        @Body('body') body: string
    ) {
        return this.ticketsService.sendEmail(req.user.tenantId, id, to, subject, body, req.user.id);
    }

    @Post(':id/messages')
    async addMessage(@Request() req: any, @Param('id') id: string, @Body('content') content: string) {
        return this.ticketsService.addMessage(req.user.tenantId, id, content, 'STAFF');
    }
}
