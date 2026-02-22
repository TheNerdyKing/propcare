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
                console.error(`[PublicService] Tenant ${tenantId} not found`);
                throw new Error(`Workspace partition for ${tenantId} does not exist. Please re-login.`);
            }

            // 2. Clear Existing Demo Data (Optional but safer for idempotency if IDs collide)
            // We use upsert so it should be fine.

            // 3. Create Properties & Units
            const properties = [
                { id: `dprop1-${tenantId.slice(0, 4)}`, name: 'Riverside Towers', addressLine1: 'Main Street 42', zip: '1001', city: 'Zurich' },
                { id: `dprop2-${tenantId.slice(0, 4)}`, name: 'Mountain View Residences', addressLine1: 'Alpine Strasse 15', zip: '6000', city: 'Lucerne' },
                { id: `dprop3-${tenantId.slice(0, 4)}`, name: 'Lakeside Lofts', addressLine1: 'Quai du Lac 8', zip: '1201', city: 'Geneva' }
            ];

            const createdProperties = [];
            for (const prop of properties) {
                const p = await this.prisma.property.upsert({
                    where: { id: prop.id },
                    update: {},
                    create: { ...prop, tenantId },
                });
                createdProperties.push(p);

                // Create Units
                const unitLabels = ['Unit 101', 'Unit 102', 'Penthouse A', 'Commercial Suite B'];
                await Promise.all(unitLabels.map(label =>
                    this.prisma.unit.upsert({
                        where: { id: `unit-${p.id}-${label.replace(/\s+/g, '-')}` },
                        update: {},
                        create: {
                            id: `unit-${p.id}-${label.replace(/\s+/g, '-')}`,
                            tenantId,
                            propertyId: p.id,
                            unitLabel: label,
                        },
                    })
                ));
            }

            // 4. Create Contractors
            const contractors = [
                { id: `dcont1-${tenantId.slice(0, 4)}`, name: 'Elite Plumbing Services', email: 'contact@eliteplumbing.demo', tradeTypes: ['Plumbing', 'Heating'] },
                { id: `dcont2-${tenantId.slice(0, 4)}`, name: 'Volt Master Electrical', email: 'info@voltmaster.demo', tradeTypes: ['Electrical'] },
                { id: `dcont3-${tenantId.slice(0, 4)}`, name: 'Swiss Clean & Maintain', email: 'service@swissclean.demo', tradeTypes: ['Cleaning', 'General Maintenance'] }
            ];

            const createdContractors = await Promise.all(contractors.map(cont =>
                this.prisma.contractor.upsert({
                    where: { id: cont.id },
                    update: {},
                    create: { ...cont, tenantId },
                })
            ));

            // Link Contractors to Properties
            await Promise.all(createdContractors.flatMap(c =>
                createdProperties.map(p =>
                    this.prisma.contractorProperty.create({
                        data: { tenantId, contractorId: c.id, propertyId: p.id }
                    }).catch(() => null)
                )
            ));

            // 5. Create Tickets
            const ticketsData = [
                {
                    referenceCode: `DEMO-${tenantId.slice(0, 4)}-001`,
                    type: TicketType.DAMAGE_REPORT,
                    status: TicketStatus.NEW,
                    propertyId: createdProperties[0].id,
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
                    propertyId: createdProperties[1].id,
                    unitLabel: 'Unit 101',
                    description: 'Minor water leakage observed under the kitchen cabinet. Possibly the drain pipe.',
                    tenantName: 'Mark Weber',
                    tenantEmail: 'm.weber@example.com',
                    urgency: Urgency.URGENT,
                },
                {
                    referenceCode: `DEMO-${tenantId.slice(0, 4)}-003`,
                    type: TicketType.DAMAGE_REPORT,
                    status: TicketStatus.COMPLETED,
                    propertyId: createdProperties[2].id,
                    unitLabel: 'Commercial Suite B',
                    description: 'Light flicker in the main hallway. Needs bulb replacement or ballast check.',
                    tenantName: 'Office Manager',
                    tenantEmail: 'manager@techhub.demo',
                    urgency: Urgency.NORMAL,
                },
                {
                    referenceCode: `DEMO-${tenantId.slice(0, 4)}-004`,
                    type: TicketType.GENERAL_INQUIRY,
                    status: TicketStatus.NEW,
                    propertyId: createdProperties[0].id,
                    unitLabel: 'Unit 102',
                    description: 'Inquiry regarding the upcoming garage maintenance schedule.',
                    tenantName: 'David Miller',
                    tenantEmail: 'd.miller@example.com',
                    urgency: Urgency.NORMAL,
                },
                {
                    referenceCode: `DEMO-${tenantId.slice(0, 4)}-005`,
                    type: TicketType.DAMAGE_REPORT,
                    status: TicketStatus.NEW,
                    propertyId: createdProperties[1].id,
                    unitLabel: 'Penthouse A',
                    description: 'EMERGENCY: Main water pipe burst in the basement. Shifting to emergency protocol.',
                    tenantName: 'Facility Guard',
                    tenantEmail: 'security@mountainview.demo',
                    urgency: Urgency.EMERGENCY,
                }
            ];

            for (const ticketData of ticketsData) {
                const ticket = await this.prisma.ticket.upsert({
                    where: { referenceCode: ticketData.referenceCode },
                    update: {},
                    create: { ...ticketData, tenantId },
                });

                if (ticketData.referenceCode.endsWith('001')) {
                    await this.prisma.ticketMessage.create({
                        data: {
                            tenantId,
                            ticketId: ticket.id,
                            content: 'Hello, we have registered your request. A technician will contact you shortly.',
                            senderType: SenderType.STAFF,
                        }
                    }).catch(() => null);
                }
            }

            console.log(`[PublicService] Seed completed for tenant: ${tenantId}`);
            return { success: true };
        } catch (error: any) {
            console.error(`[PublicService] Seed failed:`, error);
            // Re-throw with a clean message for the frontend
            throw new Error(error.message || 'Data initialization failed');
        }
    }
}
