import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketType, AiStatus, TicketStatus, Urgency, SenderType } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PublicService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
        private emailService: EmailService,
        private configService: ConfigService
    ) { }

    async createTicket(dto: CreateTicketDto) {
        const referenceCode = `PC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Find the first tenant as fallback if no specific tenant is identified
        const defaultTenant = await this.prisma.tenant.findFirst({
            select: { id: true }
        });
        const tenantId = defaultTenant?.id || 'default-tenant-uuid';

        const ticket = await this.prisma.ticket.create({
            data: {
                tenantId: tenantId,
                referenceCode,
                type: dto.type || TicketType.DAMAGE_REPORT,
                propertyId: dto.propertyId,
                unitLabel: dto.unitLabel,
                description: dto.description,
                tenantName: dto.tenantName,
                tenantEmail: dto.tenantEmail,
                tenantPhone: dto.tenantPhone,
                permissionToEnter: dto.permissionToEnter,
                urgency: dto.urgency || Urgency.UNKNOWN,
                aiStatus: AiStatus.PROCESSING,
            },
        });

        // 3. Mock External Integration (MVP Requirement B)
        // Fire and forget so we don't block the user
        this.prisma.auditLog.create({
            data: {
                tenantId: tenantId,
                action: 'EXTERNAL_SYNC_LOGGED',
                targetType: 'TICKET',
                targetId: ticket.id,
                metadataJson: { message: 'External sync simulated' },
            },
        }).catch(() => null);

        // 4. Integrated AI Processing (Non-Blocking)
        // We trigger it but DON'T await it so the response is fast.
        this.aiService.processTicket(ticket.id).catch(aiErr => {
            console.error(`In-process AI trigger failed for ${ticket.id}:`, aiErr.message);
        });

        // 5. Send confirmation email to tenant (Non-Blocking)
        if (ticket.tenantEmail) {
            const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://propcare.vercel.app';
            const trackingUrl = `${frontendUrl}/status/${ticket.id}`;
            
            this.emailService.sendDraftEmail({
                to: ticket.tenantEmail,
                subject: `Meldung eingegangen: ${referenceCode}`,
                html: `
                    <div style="font-family: sans-serif; background-color: #f8fafc; padding: 40px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; padding: 40px; border: 1px solid #e2e8f0;">
                            <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px;">Vielen Dank für Ihre Meldung</h1>
                            <p style="color: #64748b; font-size: 16px; margin-bottom: 30px;">Ihre Meldung wurde erfolgreich im System erfasst. Sie können den Status jederzeit online verfolgen.</p>
                            
                            <div style="background-color: #f1f5f9; padding: 25px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
                                <p style="text-transform: uppercase; font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 2px; margin-bottom: 10px;">Ihre Referenznummer</p>
                                <p style="font-size: 32px; font-weight: 800; color: #2563eb; letter-spacing: 3px; font-family: monospace; margin: 0;">${referenceCode}</p>
                            </div>
                            
                            <a href="${trackingUrl}" style="display: block; background-color: #2563eb; color: #ffffff; text-align: center; padding: 18px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Status verfolgen ➔</a>
                            
                            <hr style="margin-top: 40px; border: none; border-top: 1px solid #f1f5f9;">
                            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">PropCare - Ihr digitaler Begleiter für effiziente Hausverwaltung.</p>
                        </div>
                    </div>
                `
            }).catch(err => {
                console.error(`Failed to send confirmation email for ticket ${ticket.id}:`, err.message);
            });
        }

        return ticket;
    }

    async getProperties() {
        // Find properties - if we have a demo tenant or any properties at all, show them
        // In a real multi-tenant app this would be more restricted, but for MVP/Demo
        // we want to ensure the public form works.
        const properties = await this.prisma.property.findMany({
            select: { id: true, name: true },
            take: 100, // Limit for sanity
            orderBy: { name: 'asc' }
        });

        return properties;
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
                { name: 'Elite Plumbing Services', email: 'contact@eliteplumbing.demo', tradeTypes: ['PLUMBING'], serviceZipCodes: ['1001'], serviceCities: ['Zurich'] },
                { name: 'Volt Master Electrical', email: 'info@voltmaster.demo', tradeTypes: ['ELECTRICAL'], serviceZipCodes: ['6000'], serviceCities: ['Lucerne'] }
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
                        data: { ...ticket as any, tenantId }
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
