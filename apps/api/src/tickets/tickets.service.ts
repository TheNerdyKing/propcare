import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus, Role, AiStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { AiService } from '../ai/ai.service';
import { PublicService } from '../public/public.service';

@Injectable()
export class TicketsService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
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

    async sendDraftEmail(tenantId: string, id: string, dto: { toEmail: string, subject?: string, message?: string, useAiDraft: boolean }, userId: string) {
        const ticket = await this.findOne(tenantId, id);

        let subject = dto.subject;
        let body = dto.message;

        if (dto.useAiDraft) {
            const aiResult = ticket.aiResults[0];
            if (aiResult?.outputJson) {
                const output = aiResult.outputJson as any;
                subject = output.draftEmail?.subject || subject;
                body = output.draftEmail?.bodyText || body;
            }
        }

        if (!subject || !body) {
            throw new HttpException('Email subject and body are required', HttpStatus.BAD_REQUEST);
        }

        const result = await this.emailService.sendDraftEmail({
            to: dto.toEmail,
            subject: subject,
            html: body.replace(/\n/g, '<br>'),
            text: body
        });

        // Log Outbound Email
        await this.prisma.outboundEmail.create({
            data: {
                tenantId,
                ticketId: id,
                toEmail: dto.toEmail,
                subject: subject,
                body: body,
                status: 'SENT',
                sentByUserId: userId,
            },
        });

        // Update Ticket Status
        await this.prisma.ticket.update({
            where: { id, tenantId },
            data: {
                status: TicketStatus.SENT,
                updatedAt: new Date()
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
                metadataJson: { to: dto.toEmail, subject },
            },
        });

        return { ok: true, resendId: result.resendId, newStatus: TicketStatus.SENT };
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
        try {
            const ticket = await this.findOne(tenantId, id);
            await this.aiService.processTicket(id);
            return { success: true };
        } catch (err) {
            throw new HttpException(`Failed to reprocess AI: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
