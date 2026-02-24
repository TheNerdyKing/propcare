import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus, Role, InternalStatus } from '@prisma/client';
import { MailsService } from '../mails/mails.service';
// import { InjectQueue } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';
import { AiService } from '../ai/ai.service';
import { PublicService } from '../public/public.service';

@Injectable()
export class TicketsService {
    constructor(
        private prisma: PrismaService,
        private mailsService: MailsService,
        private publicService: PublicService,
        private aiService: AiService,
    ) { }

    async findAll(tenantId: string, filters: { status?: TicketStatus, search?: string, propertyId?: string }) {
        const where: any = { tenantId };
        if (filters.status) where.status = filters.status;
        if (filters.propertyId) where.propertyId = filters.propertyId;
        if (filters.search) {
            where.OR = [
                { referenceCode: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { tenantName: { contains: filters.search, mode: 'insensitive' } },
                { property: { name: { contains: filters.search, mode: 'insensitive' } } },
                { unitLabel: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.ticket.findMany({
            where,
            include: { property: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id, tenantId },
            include: {
                property: true,
                attachments: true,
                aiResults: { orderBy: { createdAt: 'desc' }, take: 1 },
                auditLogs: { orderBy: { createdAt: 'desc' } },
                outboundEmails: { orderBy: { sentAt: 'desc' } },
                messages: { orderBy: { createdAt: 'asc' } },
            }
        });

        if (!ticket) throw new NotFoundException('Ticket not found');
        return ticket;
    }

    async addMessage(tenantId: string, ticketId: string, content: string, senderType: 'STAFF' | 'TENANT') {
        return this.prisma.ticketMessage.create({
            data: {
                tenantId,
                ticketId,
                content,
                senderType,
            },
        });
    }

    async sendEmail(tenantId: string, id: string, to: string, subject: string, body: string, userId: string) {
        const ticket = await this.findOne(tenantId, id);

        // Send Email
        const result = await this.mailsService.sendEmail(to, subject, body);

        // Log Outbound Email
        await this.prisma.outboundEmail.create({
            data: {
                tenantId,
                ticketId: id,
                toEmail: to,
                subject: subject,
                body: body,
                status: result.success ? 'SENT' : 'FAILED',
                errorMessage: result.error,
                sentByUserId: userId,
            },
        });

        if (result.success) {
            // Update Ticket Status
            await this.prisma.ticket.update({
                where: { id, tenantId },
                data: {
                    status: TicketStatus.SENT,
                    internalStatus: InternalStatus.SENT,
                },
            });

            // Audit Log
            await this.prisma.auditLog.create({
                data: {
                    tenantId,
                    actorUserId: userId,
                    action: 'EMAIL_SENT',
                    targetType: 'TICKET',
                    targetId: id,
                    metadataJson: { to, subject },
                },
            });
        }

        return result;
    }

    async update(tenantId: string, id: string, data: any, userId: string) {
        const ticket = await this.prisma.ticket.update({
            where: { id, tenantId },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });

        // Create Audit Log
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                actorUserId: userId,
                action: 'STATUS_CHANGED',
                targetType: 'TICKET',
                targetId: id,
                metadataJson: { newStatus: data.status },
            },
        });

        return ticket;
    }

    async reprocessAi(tenantId: string, id: string) {
        console.log(`[TicketsService] Reprocess AI requested for ticket ${id} (Tenant: ${tenantId})`);
        try {
            const ticket = await this.findOne(tenantId, id);
            if (!ticket) {
                console.error(`[TicketsService] Ticket ${id} not found for reprocess`);
                throw new NotFoundException('Ticket not found');
            }

            console.log(`[TicketsService] Triggering direct AI analysis for ticket ${id}`);
            // Direct call, bypasses queue
            await this.aiService.processTicket(id);

            return { success: true };
        } catch (err) {
            console.error(`[TicketsService] Failed to reprocess AI for ${id}:`, err.message);
            throw err;
        }
    }
}
