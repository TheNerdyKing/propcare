import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, Urgency } from '@prisma/client';

@Injectable()
export class AiService {
    private readonly apiKey = process.env.AI_API_KEY;
    private readonly modelName = process.env.AI_MODEL_NAME || 'gpt-5-nano';
    private readonly apiEndpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/responses';

    constructor(private prisma: PrismaService) { }

    async processTicket(ticketId: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { property: true },
        });

        if (!ticket) return;

        // 1. Call OpenAI API
        let classification: string = 'GENERAL_MAINTENANCE';
        let urgency: Urgency = 'NORMAL';
        let emailDraft: string = '';

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.modelName,
                    input: this.buildPrompt(ticket),
                    store: true
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API failed: ${response.statusText}. ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            // Assuming gpt-5-nano returns the classification and draft in a standard format
            // Based on the user's provided curl, we might need to parse the response content
            const aiOutput = this.parseAiResponse(data);

            classification = aiOutput.category || 'GENERAL_MAINTENANCE';
            urgency = (aiOutput.urgency as Urgency) || 'NORMAL';
            emailDraft = aiOutput.emailDraft || '';

        } catch (err) {
            console.error('AI Processing failed, falling back to heuristics:', err);
            classification = this.classifyDamage(ticket.description);
            urgency = this.determineUrgency(ticket.description, ticket.urgency) as Urgency;
            emailDraft = this.generateEmailDraft(ticket, classification, null);
        }

        const contractors = await this.suggestContractors(ticket.tenantId, classification, ticket.propertyId);

        // Save AI results
        await this.prisma.aiResult.create({
            data: {
                tenantId: ticket.tenantId,
                ticketId: ticket.id,
                modelName: this.modelName,
                promptVersion: '2.0',
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
                status: 'AI_READY',
                internalStatus: 'AI_READY'
            },
        });
    }

    private buildPrompt(ticket: any): string {
        return `
            Act as an expert facility management assistant for PropCare. 
            Analyze the following maintenance request and provide a JSON response.
            
            TICKET DESCRIPTION: "${ticket.description}"
            REF CODE: ${ticket.referenceCode}
            FACILITY: ${ticket.property?.name || 'Unknown'} / ${ticket.unitLabel || 'Common Area'}
            
            JSON OUTPUT FORMAT:
            {
                "category": "PLUMBING" | "ELECTRICAL" | "LOCKSMITH" | "HEATING" | "GENERAL_MAINTENANCE",
                "urgency": "EMERGENCY" | "URGENT" | "NORMAL",
                "emailDraft": "A professional email draft to a contractor explaining the situation clearly."
            }
            
            RULES:
            - Provide ONLY the JSON.
            - Category must match the enum exactly.
            - Urgency must be one of the three options.
        `;
    }

    private parseAiResponse(data: any): any {
        // According to the new OpenAI 'responses' API (experimental), the block might be different
        // But we will attempt to extract the text if it's in a standard content block
        try {
            // For gpt-5-nano /v1/responses, the data structure might vary (experimental)
            // Assuming standard completion-like structure for the text result
            const content = data.output || data.choices?.[0]?.message?.content || data.response || "";
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return {};
        } catch (e) {
            console.error('Failed to parse AI JSON:', e);
            return {};
        }
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
