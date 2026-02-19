import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, Urgency } from '@prisma/client';

@Injectable()
export class AiService {
    constructor(private prisma: PrismaService) { }

    async processTicket(ticketId: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { property: true },
        });

        if (!ticket) return;

        // Simulate AI Processing Logic
        const classification = this.classifyDamage(ticket.description);
        const urgency = this.determineUrgency(ticket.description, ticket.urgency);
        const contractors = await this.suggestContractors(ticket.tenantId, classification, ticket.propertyId);
        const emailDraft = this.generateEmailDraft(ticket, classification, contractors[0]);

        // Save AI results
        await this.prisma.aiResult.create({
            data: {
                tenantId: ticket.tenantId,
                ticketId: ticket.id,
                modelName: 'propcare-ai-v1',
                promptVersion: '1.0',
                outputJson: {
                    category: classification,
                    urgency: urgency,
                    contractors: contractors,
                    emailDraft: emailDraft,
                },
            },
        });

        // Update ticket internal status
        await this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                urgency: urgency as Urgency,
                category: classification,
                // Assuming we add internalStatus to the model or use a status flag
            },
        });
    }

    private classifyDamage(description: string): string {
        const desc = description.toLowerCase();
        if (desc.includes('leak') || desc.includes('water') || desc.includes('pipe')) return 'PLUMBING';
        if (desc.includes('light') || desc.includes('power') || desc.includes('electricity')) return 'ELECTRICAL';
        if (desc.includes('lock') || desc.includes('key') || desc.includes('door')) return 'LOCKSMITH';
        if (desc.includes('heat') || desc.includes('cold') || desc.includes('hvac')) return 'HEATING';
        return 'GENERAL_MAINTENANCE';
    }

    private determineUrgency(description: string, reportedUrgency: string): string {
        const desc = description.toLowerCase();
        if (desc.includes('flood') || desc.includes('fire') || desc.includes('burst')) return 'EMERGENCY';
        if (reportedUrgency === 'EMERGENCY') return 'EMERGENCY';
        if (reportedUrgency === 'URGENT') return 'URGENT';
        return 'NORMAL';
    }

    private async suggestContractors(tenantId: string, category: string, propertyId: string | null) {
        // 1. Get the property location if available
        let zipCode: string | undefined;
        let city: string | undefined;

        if (propertyId) {
            const property = await this.prisma.property.findUnique({
                where: { id: propertyId },
                select: { zip: true, city: true },
            });
            zipCode = property?.zip;
            city = property?.city;
        }

        // 2. Filter internal contractors
        const internalContractors = await this.prisma.contractor.findMany({
            where: {
                tenantId,
                tradeTypes: { has: category },
                OR: [
                    // Match by explicit property mapping
                    { properties: propertyId ? { some: { propertyId } } : undefined },
                    // Match by location
                    { serviceZipCodes: zipCode ? { has: zipCode } : undefined },
                    { serviceCities: city ? { has: city } : undefined },
                ],
            },
            take: 3,
            include: { properties: true }
        });

        if (internalContractors.length > 0) {
            return internalContractors.map(c => ({
                id: c.id,
                name: c.name,
                trade: category,
                matchScore: this.calculateMatchScore(c, category, zipCode, city, propertyId),
                source: 'INTERNAL',
            }));
        }

        // 3. Fallback: Placeholder for external suggestions
        return [
            {
                id: 'external-fallback',
                name: 'Generic Trade Partner (CH)',
                trade: category,
                matchScore: 60,
                source: 'EXTERNAL_FALLBACK',
            }
        ];
    }

    private calculateMatchScore(c: any, category: string, zipCode?: string, city?: string, propertyId?: string | null): number {
        let score = 50;
        if (c.tradeTypes.includes(category)) score += 30;
        if (propertyId && c.properties?.some((p: any) => p.propertyId === propertyId)) score += 20;
        if (zipCode && c.serviceZipCodes?.includes(zipCode)) score += 15;
        if (city && c.serviceCities?.includes(city)) score += 10;
        return Math.min(score, 100);
    }

    private generateEmailDraft(ticket: any, category: string, contractor: any) {
        const contractorName = contractor?.name || '{Contractor Name}';
        return `Subject: New Maintenance Request: ${ticket.referenceCode} - ${category}

Dear ${contractorName},

A new ${category.toLowerCase()} issue has been reported at ${ticket.property?.name || 'the property'}, Unit ${ticket.unitLabel}.

Description:
${ticket.description}

Tenant: ${ticket.tenantName}
Permission to enter: ${ticket.permissionToEnter ? 'YES' : 'NO'}

Please let us know your availability to handle this request.

Best regards,
PropCare Team`;
    }
}
