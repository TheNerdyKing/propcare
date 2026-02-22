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
            console.log(`[PublicService] Starting seed for tenant: ${tenantId}`);

            // 1. Verify Tenant Exists
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant) {
                console.error(`[PublicService] Tenant ${tenantId} not found in database.`);
                return { success: false, error: 'Tenant not found' };
            }

            // 2. Check if already seeded to avoid redundant work
            const existingCount = await this.prisma.property.count({ where: { tenantId } });
            if (existingCount > 0) {
                console.log(`[PublicService] Tenant ${tenantId} already has ${existingCount} properties. Skipping base seed.`);
            } else {
                // 3. Create Properties & Units
                const propsData = [
                    { name: 'Riverside Towers', addressLine1: 'Main Street 42', zip: '1001', city: 'Zurich' },
                    { name: 'Mountain View Residences', addressLine1: 'Alpine Strasse 15', zip: '6000', city: 'Lucerne' },
                    { name: 'Lakeside Lofts', addressLine1: 'Quai du Lac 8', zip: '1201', city: 'Geneva' }
                ];

                for (const prop of propsData) {
                    const p = await this.prisma.property.create({
                        data: { ...prop, tenantId },
                    });

                    // Create Units
                    const unitLabels = ['Unit 101', 'Unit 102', 'Penthouse A', 'Commercial Suite B'];
                    for (const label of unitLabels) {
                        await this.prisma.unit.create({
                            data: {
                                tenantId,
                                propertyId: p.id,
                                unitLabel: label,
                            },
                        });
                    }
                }
            }

            // 4. Create Contractors if missing
            const contractorCount = await this.prisma.contractor.count({ where: { tenantId } });
            if (contractorCount === 0) {
                const contractors = [
                    { name: 'Elite Plumbing Services', email: 'contact@eliteplumbing.demo', tradeTypes: ['Plumbing', 'Heating'] },
                    { name: 'Volt Master Electrical', email: 'info@voltmaster.demo', tradeTypes: ['Electrical'] },
                    { name: 'Swiss Clean & Maintain', email: 'service@swissclean.demo', tradeTypes: ['Cleaning', 'General Maintenance'] }
                ];

                for (const cont of contractors) {
                    const c = await this.prisma.contractor.create({
                        data: { ...cont, tenantId },
                    });

                    // Link to all properties for this tenant
                    const tenantProps = await this.prisma.property.findMany({ where: { tenantId } });
                    for (const p of tenantProps) {
                        await this.prisma.contractorProperty.create({
                            data: { tenantId, contractorId: c.id, propertyId: p.id }
                        }).catch(() => null);
                    }
                }
            }

            // 5. Create Tickets if missing
            const ticketCount = await this.prisma.ticket.count({ where: { tenantId } });
            if (ticketCount === 0) {
                const tenantProps = await this.prisma.property.findMany({ where: { tenantId } });
                if (tenantProps.length > 0) {
                    const ticketsData = [
                        {
                            referenceCode: `DEMO-${tenantId.slice(0, 4)}-001`,
                            type: TicketType.DAMAGE_REPORT,
                            status: TicketStatus.NEW,
                            propertyId: tenantProps[0].id,
                            unitLabel: 'Penthouse A',
                            description: 'The AC unit is making a loud buzzing sound and not cooling properly.',
                            tenantName: 'Sarah Jenkins',
                            tenantEmail: 'sarah.j@example.com',
                            urgency: Urgency.NORMAL,
                        },
                        {
                            referenceCode: `DEMO-${tenantId.slice(0, 4)}-002`,
                            type: TicketType.DAMAGE_REPORT,
                            status: TicketStatus.IN_PROGRESS,
                            propertyId: tenantProps[1 % tenantProps.length].id,
                            unitLabel: 'Unit 101',
                            description: 'Minor water leakage observed under the kitchen cabinet. Possibly the drain pipe.',
                            tenantName: 'Mark Weber',
                            tenantEmail: 'm.weber@example.com',
                            urgency: Urgency.URGENT,
                        }
                    ];

                    for (const ticketData of ticketsData) {
                        try {
                            await this.prisma.ticket.create({
                                data: { ...ticketData, tenantId },
                            });
                        } catch (e) {
                            console.warn(`[PublicService] Ticket creation failed (possibly duplicate): ${ticketData.referenceCode}`);
                        }
                    }
                }
            }

            console.log(`[PublicService] Seed operations completed for tenant: ${tenantId}`);
            return { success: true };
        } catch (error: any) {
            console.error(`[PublicService] Seed failed critically:`, error);
            throw error;
        }
    }
}
