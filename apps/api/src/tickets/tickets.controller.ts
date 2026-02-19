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

    @Get(':id')
    async findOne(@Request() req: any, @Param('id') id: string) {
        return this.ticketsService.findOne(req.user.tenantId, id);
    }

    @Patch(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        return this.ticketsService.update(req.user.tenantId, id, data, req.user.sub);
    }

    @Post(':id/send-contractor-email')
    async sendContractorEmail(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        return this.ticketsService.sendContractorEmail(req.user.tenantId, id, data, req.user.sub);
    }

    @Post(':id/messages')
    async addMessage(@Request() req: any, @Param('id') id: string, @Body('content') content: string) {
        return this.ticketsService.addMessage(req.user.tenantId, id, content, 'STAFF');
    }

    @Post(':id/reprocess-ai')
    async reprocessAi(@Request() req: any, @Param('id') id: string) {
        return this.ticketsService.reprocessAi(req.user.tenantId, id);
    }
}
