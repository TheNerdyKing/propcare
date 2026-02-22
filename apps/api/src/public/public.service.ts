import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketType, InternalStatus, TicketStatus, Urgency, SenderType } from '@prisma/client';
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
                senderType: SenderType.TENANT,
            },
        });
    }

    async seedDemoDataForTenant(tenantId: string) {
        try {
            console.log(`[PublicService] SEED START for tenant: ${tenantId}`);

            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant) return { success: false, error: 'Tenant record missing' };

            // 1. Properties
            const propsData = [
                { name: 'Riverside Towers', addressLine1: 'Main Street 42', zip: '1001', city: 'Zurich' },
                { name: 'Mountain View Residences', addressLine1: 'Alpine Strasse 15', zip: '6000', city: 'Lucerne' },
                { name: 'Lakeside Lofts', addressLine1: 'Quai du Lac 8', zip: '1201', city: 'Geneva' }
            ];

            const createdProps = [];
            for (const prop of propsData) {
                let p = await this.prisma.property.findFirst({
                    where: { tenantId, name: prop.name }
                });

                if (!p) {
                    p = await this.prisma.property.create({
                        data: { ...prop, tenantId }
                    });
                }
                createdProps.push(p);

                // Units
                const unitLabels = ['Unit 101', 'Penthouse A', 'Commercial Suite B'];
                for (const label of unitLabels) {
                    const exists = await this.prisma.unit.findFirst({
                        where: { propertyId: p.id, unitLabel: label }
                    });
                    if (!exists) {
                        await this.prisma.unit.create({
                            data: { tenantId, propertyId: p.id, unitLabel: label }
                        });
                    }
                }
            }

            // 2. Contractors
            const contractors = [
                { name: 'Elite Plumbing Services', email: 'contact@eliteplumbing.demo', tradeTypes: ['Plumbing'] },
                { name: 'Volt Master Electrical', email: 'info@voltmaster.demo', tradeTypes: ['Electrical'] }
            ];

            for (const cont of contractors) {
                let c = await this.prisma.contractor.findFirst({
                    where: { tenantId, name: cont.name }
                });

                if (!c) {
                    c = await this.prisma.contractor.create({
                        data: { ...cont, tenantId }
                    });
                }

                // Link to properties
                for (const p of createdProps) {
                    const linkExists = await this.prisma.contractorProperty.findFirst({
                        where: { contractorId: c.id, propertyId: p.id }
                    });
                    if (!linkExists) {
                        await this.prisma.contractorProperty.create({
                            data: { tenantId, contractorId: c.id, propertyId: p.id }
                        }).catch(() => null);
                    }
                }
            }

            // 3. Tickets
            const hash = tenantId.slice(-4);
            const ticketsData = [
                {
                    referenceCode: `DEMO-${hash}-001`,
                    type: TicketType.DAMAGE_REPORT,
                    status: TicketStatus.NEW,
                    propertyId: createdProps[0].id,
                    unitLabel: 'Penthouse A',
                    description: 'The AC unit is making a loud buzzing sound and not cooling properly.',
                    tenantName: 'Sarah Jenkins',
                    tenantEmail: 'sarah.j@example.com',
                    urgency: Urgency.NORMAL,
                },
                {
                    referenceCode: `DEMO-${hash}-002`,
                    type: TicketType.DAMAGE_REPORT,
                    status: TicketStatus.IN_PROGRESS,
                    propertyId: createdProps[1].id,
                    unitLabel: 'Unit 101',
                    description: 'Minor water leakage observed under the kitchen cabinet. Possibly the drain pipe.',
                    tenantName: 'Mark Weber',
                    tenantEmail: 'm.weber@example.com',
                    urgency: Urgency.URGENT,
                }
            ];

            for (const ticket of ticketsData) {
                const exists = await this.prisma.ticket.findUnique({
                    where: { referenceCode: ticket.referenceCode }
                });
                if (!exists) {
                    await this.prisma.ticket.create({
                        data: { ...ticket, tenantId }
                    });
                }
            }

            console.log(`[PublicService] SEED SUCCESS for tenant: ${tenantId}`);
            return { success: true };
        } catch (error: any) {
            console.error(`[PublicService] SEED ERROR:`, error);
            return { success: false, error: error.message };
        }
    }
}
