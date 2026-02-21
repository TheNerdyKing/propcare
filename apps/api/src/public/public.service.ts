import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketType, InternalStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PublicService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue('ai-processing') private aiQueue: Queue
    ) { }

    async createTicket(dto: CreateTicketDto) {
        // ... (reference code logic)
        const referenceCode = `PC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const defaultTenantId = 'default-tenant-uuid';

        const ticket = await this.prisma.ticket.create({
            data: {
                tenantId: defaultTenantId,
                referenceCode,
                type: dto.type || TicketType.DAMAGE_REPORT,
                propertyId: dto.propertyId,
                unitLabel: dto.unitLabel,
                description: dto.description,
                tenantName: dto.tenantName,
                tenantEmail: dto.tenantEmail,
                tenantPhone: dto.tenantPhone,
                permissionToEnter: dto.permissionToEnter,
                urgency: dto.urgency,
                internalStatus: InternalStatus.AI_PROCESSING,
            },
        });

        // Enqueue AI job
        await this.aiQueue.add('process-ticket', { ticketId: ticket.id });

        return ticket;
    }

    async getProperties() {
        return this.prisma.property.findMany({
            where: { tenantId: 'default-tenant-uuid' },
            select: { id: true, name: true },
        });
    }

    async getTicketByReference(referenceCode: string) {
        return this.prisma.ticket.findUnique({
            where: { referenceCode },
            include: {
                property: { select: { name: true } },
                messages: { orderBy: { createdAt: 'asc' } },
            }
        });
    }

    async addPublicMessage(referenceCode: string, content: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { referenceCode },
            select: { id: true, tenantId: true }
        });

        if (!ticket) throw new Error('Ticket not found');

        return this.prisma.ticketMessage.create({
            data: {
                tenantId: ticket.tenantId,
                ticketId: ticket.id,
                content,
                senderType: 'TENANT',
            },
        });
    }

    async seedDemoData() {
        const tenantId = 'default-tenant-uuid';

        // Create Properties
        const prop1 = await this.prisma.property.upsert({
            where: { id: 'prop-1' },
            update: {},
            create: {
                id: 'prop-1',
                tenantId,
                name: 'Seaside Apartments',
                addressLine1: 'Marina Drive 101',
                zip: '8000',
                city: 'Zurich',
            },
        });

        // Create Tickets
        await this.prisma.ticket.upsert({
            where: { referenceCode: 'TKT-2024-001' },
            update: {},
            create: {
                tenantId,
                referenceCode: 'TKT-2024-001',
                type: TicketType.DAMAGE_REPORT,
                status: 'NEW',
                propertyId: prop1.id,
                unitLabel: 'Apt 4B',
                description: 'Water leak under the kitchen sink.',
                tenantName: 'John Doe',
                tenantEmail: 'john.doe@example.com',
                urgency: 'URGENT',
            },
        });

        return { success: true };
    }

    async seedDemoDataForTenant(tenantId: string) {
        // Create Properties
        const prop1 = await this.prisma.property.upsert({
            where: { id: `demo-prop-${tenantId.slice(0, 8)}` },
            update: {},
            create: {
                id: `demo-prop-${tenantId.slice(0, 8)}`,
                tenantId,
                name: 'Riverside Towers',
                addressLine1: 'Main Street 42',
                zip: '10001',
                city: 'Metropolis',
            },
        });

        // Create Tickets
        await this.prisma.ticket.upsert({
            where: { referenceCode: `DEMO-${tenantId.slice(0, 4)}-001` },
            update: {},
            create: {
                tenantId,
                referenceCode: `DEMO-${tenantId.slice(0, 4)}-001`,
                type: TicketType.DAMAGE_REPORT,
                status: 'NEW',
                propertyId: prop1.id,
                unitLabel: 'Penthouse A',
                description: 'AC unit is making a loud buzzing sound and not cooling properly.',
                tenantName: 'Alice Johnson',
                tenantEmail: 'alice.j@example.com',
                urgency: 'NORMAL',
            },
        });

        return { success: true };
    }
}
