import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus, Role, InternalStatus } from '@prisma/client';
import { MailsService } from '../mails/mails.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PublicService } from '../public/public.service';

@Injectable()
export class TicketsService {
    constructor(
        private prisma: PrismaService,
        private mailsService: MailsService,
        private publicService: PublicService,
        @InjectQueue('ai-processing') private aiQueue: Queue,
    ) { }

    async findAll(tenantId: string, filters: { status?: TicketStatus, search?: string, propertyId?: string }) {
        const count = await this.prisma.ticket.count({ where: { tenantId } });
        if (count === 0) {
            console.log(`[TicketsService] NO DATA detected for tenant: ${tenantId}. Triggering robust seeding...`);
            try {
                const result = await this.publicService.seedDemoDataForTenant(tenantId);
                console.log(`[TicketsService] Seeding result: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
            } catch (e: any) {
                console.error('[TicketsService] Seeding crashed:', e.message);
            }
        }

        const where: any = { tenantId };
        if (filters.status) where.status = filters.status;
        if (filters.propertyId) where.propertyId = filters.propertyId;
        if (filters.search) {
            where.OR = [
                { referenceCode: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { tenantName: { contains: filters.search, mode: 'insensitive' } },
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

    async sendContractorEmail(tenantId: string, id: string, data: { to: string; subject: string; body: string }, userId: string) {
        const ticket = await this.findOne(tenantId, id);

        // Send Email
        const result = await this.mailsService.sendEmail(data.to, data.subject, data.body);

        // Log Outbound Email
        await this.prisma.outboundEmail.create({
            data: {
                tenantId,
                ticketId: id,
                toEmail: data.to,
                subject: data.subject,
                body: data.body,
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
                    status: TicketStatus.IN_PROGRESS,
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
                    metadataJson: { to: data.to, subject: data.subject },
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
        const ticket = await this.findOne(tenantId, id);
        await this.aiQueue.add('process-ticket', { ticketId: id });

        await this.prisma.ticket.update({
            where: { id, tenantId },
            data: { internalStatus: InternalStatus.AI_PROCESSING }
        });

        return { success: true };
    }
}
