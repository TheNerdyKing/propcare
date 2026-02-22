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
            console.log(`[PublicService] ULTIMATE SEED START for tenant: ${tenantId}`);

            // 1. Verify Tenant
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant) return { success: false, error: 'Tenant record missing' };

            const hash = tenantId.slice(-6); // Stable suffix for IDs

            // 2. Properties (Upsert with deterministic IDs)
            const propsData = [
                { id: `demo-prop-${hash}-1`, name: 'Riverside Towers', addressLine1: 'Main Street 42', zip: '1001', city: 'Zurich' },
                { id: `demo-prop-${hash}-2`, name: 'Mountain View Residences', addressLine1: 'Alpine Strasse 15', zip: '6000', city: 'Lucerne' },
                { id: `demo-prop-${hash}-3`, name: 'Lakeside Lofts', addressLine1: 'Quai du Lac 8', zip: '1201', city: 'Geneva' }
            ];

            const createdProps = [];
            for (const prop of propsData) {
                const p = await this.prisma.property.upsert({
                    where: { id: prop.id },
                    update: {},
                    create: { ...prop, tenantId }
                });
                createdProps.push(p);

                // Units
                const unitLabels = ['Unit 101', 'Penthouse A', 'Commercial Suite B'];
                for (let i = 0; i < unitLabels.length; i++) {
                    const label = unitLabels[i];
                    await this.prisma.unit.upsert({
                        where: { id: `demo-unit-${hash}-${p.id.slice(-4)}-${i}` },
                        update: {},
                        create: {
                            id: `demo-unit-${hash}-${p.id.slice(-4)}-${i}`,
                            tenantId,
                            propertyId: p.id,
                            unitLabel: label
                        }
                    });
                }
            }

            // 3. Contractors
            const contractors = [
                { id: `demo-cont-${hash}-1`, name: 'Elite Plumbing Services', email: 'contact@eliteplumbing.demo', tradeTypes: ['Plumbing'] },
                { id: `demo-cont-${hash}-2`, name: 'Volt Master Electrical', email: 'info@voltmaster.demo', tradeTypes: ['Electrical'] }
            ];

            for (const cont of contractors) {
                const c = await this.prisma.contractor.upsert({
                    where: { id: cont.id },
                    update: {},
                    create: { ...cont, tenantId }
                });

                // Link to properties
                for (const p of createdProps) {
                    await this.prisma.contractorProperty.create({
                        data: {
                            id: `demo-cp-${hash}-${c.id.slice(-3)}-${p.id.slice(-3)}`,
                            tenantId,
                            contractorId: c.id,
                            propertyId: p.id
                        }
                    }).catch(() => null); // Ignore if link already exists
                }
            }

            // 4. Tickets
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
                },
                {
                    referenceCode: `DEMO-${hash}-003`,
                    type: TicketType.DAMAGE_REPORT,
                    status: TicketStatus.COMPLETED,
                    propertyId: createdProps[2].id,
                    unitLabel: 'Commercial Suite B',
                    description: 'Light flicker in the main hallway. Needs bulb replacement or ballast check.',
                    tenantName: 'Office Manager',
                    tenantEmail: 'manager@techhub.demo',
                    urgency: Urgency.NORMAL,
                }
            ];

            for (const ticket of ticketsData) {
                await this.prisma.ticket.upsert({
                    where: { referenceCode: ticket.referenceCode },
                    update: {},
                    create: { ...ticket, tenantId }
                });
            }

            console.log(`[PublicService] ULTIMATE SEED SUCCESS for tenant: ${tenantId}`);
            return { success: true };
        } catch (error: any) {
            console.error(`[PublicService] ULTIMATE SEED CRITICAL ERROR:`, error);
            throw error;
        }
    }
}
