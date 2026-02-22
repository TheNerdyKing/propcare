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

    async seedDemoDataForTenant(tenantId: string) {
        // Create Properties
        const properties = [
            {
                id: `demo-prop-1-${tenantId.slice(0, 8)}`,
                name: 'Riverside Towers',
                addressLine1: 'Main Street 42',
                zip: '1001',
                city: 'Zurich',
            },
            {
                id: `demo-prop-2-${tenantId.slice(0, 8)}`,
                name: 'Mountain View Residences',
                addressLine1: 'Alpine Strasse 15',
                zip: '6000',
                city: 'Lucerne',
            },
            {
                id: `demo-prop-3-${tenantId.slice(0, 8)}`,
                name: 'Lakeside Lofts',
                addressLine1: 'Quai du Lac 8',
                zip: '1201',
                city: 'Geneva',
            }
        ];

        const createdProperties = [];
        for (const prop of properties) {
            const p = await this.prisma.property.upsert({
                where: { id: prop.id },
                update: {},
                create: {
                    ...prop,
                    tenantId,
                },
            });
            createdProperties.push(p);

            // Create Units for each property
            const units = ['Unit 101', 'Unit 102', 'Penthouse A', 'Commercial Suite B'];
            for (const unitLabel of units) {
                await this.prisma.unit.upsert({
                    where: { id: `${p.id}-${unitLabel.replace(' ', '-')}` },
                    update: {},
                    create: {
                        id: `${p.id}-${unitLabel.replace(' ', '-')}`,
                        tenantId,
                        propertyId: p.id,
                        unitLabel,
                    },
                });
            }
        }

        // Create Contractors
        const contractors = [
            {
                id: `demo-cont-1-${tenantId.slice(0, 8)}`,
                name: 'Elite Plumbing Services',
                email: 'contact@eliteplumbing.demo',
                tradeTypes: ['Plumbing', 'Heating'],
            },
            {
                id: `demo-cont-2-${tenantId.slice(0, 8)}`,
                name: 'Volt Master Electrical',
                email: 'info@voltmaster.demo',
                tradeTypes: ['Electrical'],
            },
            {
                id: `demo-cont-3-${tenantId.slice(0, 8)}`,
                name: 'Swiss Clean & Maintain',
                email: 'service@swissclean.demo',
                tradeTypes: ['Cleaning', 'General Maintenance'],
            }
        ];

        for (const cont of contractors) {
            const contractor = await this.prisma.contractor.upsert({
                where: { id: cont.id },
                update: {},
                create: {
                    ...cont,
                    tenantId,
                },
            });

            // Link contractors to all demo properties
            for (const prop of createdProperties) {
                await this.prisma.contractorProperty.create({
                    data: {
                        tenantId,
                        contractorId: contractor.id,
                        propertyId: prop.id,
                    }
                }).catch(() => { /* skip if already linked */ });
            }
        }

        // Create a Variety of Tickets
        const ticketsData = [
            {
                referenceCode: `DEMO-${tenantId.slice(0, 4)}-001`,
                type: TicketType.DAMAGE_REPORT,
                status: 'NEW' as any,
                propertyId: createdProperties[0].id,
                unitLabel: 'Penthouse A',
                description: 'The AC unit is making a loud buzzing sound and not cooling properly.',
                tenantName: 'Sarah Jenkins',
                tenantEmail: 'sarah.j@example.com',
                urgency: 'NORMAL' as any,
            },
            {
                referenceCode: `DEMO-${tenantId.slice(0, 4)}-002`,
                type: TicketType.DAMAGE_REPORT,
                status: 'IN_PROGRESS' as any,
                propertyId: createdProperties[1].id,
                unitLabel: 'Unit 101',
                description: 'Minor water leakage observed under the kitchen cabinet. Possibly the drain pipe.',
                tenantName: 'Mark Weber',
                tenantEmail: 'm.weber@example.com',
                urgency: 'URGENT' as any,
            },
            {
                referenceCode: `DEMO-${tenantId.slice(0, 4)}-003`,
                type: TicketType.DAMAGE_REPORT,
                status: 'COMPLETED' as any,
                propertyId: createdProperties[2].id,
                unitLabel: 'Commercial Suite B',
                description: 'Light flicker in the main hallway. Needs bulb replacement or ballast check.',
                tenantName: 'Office Manager',
                tenantEmail: 'manager@techhub.demo',
                urgency: 'NORMAL' as any,
            },
            {
                referenceCode: `DEMO-${tenantId.slice(0, 4)}-004`,
                type: TicketType.GENERAL_INQUIRY,
                status: 'NEW' as any,
                propertyId: createdProperties[0].id,
                unitLabel: 'Unit 102',
                description: 'Inquiry regarding the upcoming garage maintenance schedule.',
                tenantName: 'David Miller',
                tenantEmail: 'd.miller@example.com',
                urgency: 'NORMAL' as any,
            },
            {
                referenceCode: `DEMO-${tenantId.slice(0, 4)}-005`,
                type: TicketType.DAMAGE_REPORT,
                status: 'NEW' as any,
                propertyId: createdProperties[1].id,
                unitLabel: 'Penthouse A',
                description: 'EMERGENCY: Main water pipe burst in the basement. Shifting to emergency protocol.',
                tenantName: 'Facility Guard',
                tenantEmail: 'security@mountainview.demo',
                urgency: 'EMERGENCY' as any,
            }
        ];

        for (const ticketData of ticketsData) {
            const ticket = await this.prisma.ticket.upsert({
                where: { referenceCode: ticketData.referenceCode },
                update: {},
                create: {
                    ...ticketData,
                    tenantId,
                },
            });

            // Add an initial message to the first ticket
            if (ticketData.referenceCode.endsWith('001')) {
                await this.prisma.ticketMessage.create({
                    data: {
                        tenantId,
                        ticketId: ticket.id,
                        content: 'Hello, we have registered your request. A technician will contact you shortly.',
                        senderType: 'STAFF',
                    }
                });
            }
        }

        return { success: true };
    }
}
