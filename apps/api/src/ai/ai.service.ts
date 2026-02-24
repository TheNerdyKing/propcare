import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, Urgency } from '@prisma/client';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    private readonly modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
    private readonly apiEndpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';

    constructor(private prisma: PrismaService) { }

    async processTicket(ticketId: string, actorUserId?: string) {
        this.logger.log(`Starting AI processing for ticket: ${ticketId}`);

        // 0. Audit Log: AI_START
        await this.prisma.auditLog.create({
            data: {
                tenantId: (await this.prisma.ticket.findUnique({ where: { id: ticketId }, select: { tenantId: true } }))?.tenantId || 'default-tenant-uuid',
                action: 'AI_START',
                targetType: 'TICKET',
                targetId: ticketId,
                actorUserId: actorUserId || null,
                metadataJson: { model: this.modelName }
            }
        });

        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { property: true },
        });

        if (!ticket) {
            this.logger.error(`AI processing aborted: Ticket ${ticketId} not found.`);
            return;
        }

        let classification: string = 'GENERAL_MAINTENANCE';
        let urgency: Urgency = 'NORMAL';
        let emailDraft: string = '';

        try {
            // 1. Instant Validation - Handle empty/short descriptions immediately
            if (!ticket.description || ticket.description.trim().length < 10) {
                this.logger.log(`Ticket ${ticketId} has insufficient description. Marking as NEEDS_ATTENTION.`);

                // Audit Log: AI_SKIPPED
                await this.prisma.auditLog.create({
                    data: {
                        tenantId: ticket.tenantId,
                        action: 'AI_SKIPPED',
                        targetType: 'TICKET',
                        targetId: ticketId,
                        metadataJson: { reason: 'insufficient_description', length: ticket.description?.length || 0 }
                    }
                });

                await this.prisma.ticket.update({
                    where: { id: ticketId },
                    data: {
                        internalStatus: 'NEEDS_ATTENTION' as any,
                        status: 'NEEDS_ATTENTION' as any
                    }
                });
                return;
            }

            // 2. Call OpenAI API
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [
                        { role: 'system', content: 'You are a facility manager. Return ONLY JSON.' },
                        { role: 'user', content: this.buildPrompt(ticket) }
                    ],
                    max_tokens: 500,
                    temperature: 0,
                    response_format: { type: "json_object" }
                }),
            });

            if (!response.ok) {
                throw new Error(`OpenAI API failed: ${response.statusText}`);
            }

            const data = await response.json();
            const aiOutput = this.parseAiResponse(data);

            classification = aiOutput.category || this.classifyDamage(ticket.description);
            urgency = (aiOutput.urgency as Urgency) || (this.determineUrgency(ticket.description, 'NORMAL') as Urgency);
            emailDraft = aiOutput.emailDraft || this.generateEmailDraft(ticket, classification, null);

            // 3. Save AI results
            await this.prisma.aiResult.create({
                data: {
                    tenantId: ticket.tenantId,
                    ticketId: ticket.id,
                    modelName: this.modelName,
                    promptVersion: '4.0-supabase-pure',
                    outputJson: {
                        category: classification,
                        urgency: urgency,
                        emailDraft: emailDraft,
                    },
                },
            });

            // 4. Update ticket internal status to TERMINAL state (AI_READY)
            await this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    urgency: urgency as Urgency,
                    category: classification,
                    status: 'AI_READY' as any,
                    internalStatus: 'AI_READY' as any
                },
            });

            // Audit Log: AI_SUCCESS
            await this.prisma.auditLog.create({
                data: {
                    tenantId: ticket.tenantId,
                    action: 'AI_SUCCESS',
                    targetType: 'TICKET',
                    targetId: ticketId,
                    metadataJson: { category: classification, urgency: urgency }
                }
            });

            this.logger.log(`AI processing completed successfully (Terminal: AI_READY) for ticket: ${ticketId}`);

        } catch (err) {
            this.logger.error(`AI Processing FAILED for ${ticketId}: ${err.message}`);

            // GUARANTEE TERMINAL STATE: Force update to FAILED if anything crashes
            try {
                await this.prisma.ticket.update({
                    where: { id: ticketId },
                    data: {
                        status: 'FAILED' as any,
                        internalStatus: 'FAILED' as any
                    }
                });

                // Audit Log: AI_FAILED
                await this.prisma.auditLog.create({
                    data: {
                        tenantId: ticket?.tenantId || 'default-tenant-uuid',
                        action: 'AI_FAILED',
                        targetType: 'TICKET',
                        targetId: ticketId,
                        metadataJson: { error: err.message }
                    }
                });
            } catch (dbErr) {
                this.logger.error(`FATAL: Could not even set terminal FAILED state for ${ticketId}: ${dbErr.message}`);
            }

            throw err;
        }
    }

    private buildPrompt(ticket: any): string {
        return `Analyze maintenance request and return JSON:
        DESCRIPTION: "${ticket.description}"
        FACILITY: ${ticket.property?.name || 'Unknown'} - ${ticket.unitLabel || 'Common Area'}
        
        FORMAT:
        {
            "category": "PLUMBING" | "ELECTRICAL" | "LOCKSMITH" | "HEATING" | "GENERAL_MAINTENANCE",
            "urgency": "EMERGENCY" | "URGENT" | "NORMAL",
            "emailDraft": "Concise contractor email draft."
        }`;
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
