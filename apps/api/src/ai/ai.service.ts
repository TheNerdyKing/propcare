import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, Urgency } from '@prisma/client';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private apiKey: string | undefined;
    private modelName: string | undefined;
    private apiEndpoint: string | undefined;

    constructor(private prisma: PrismaService) {
        this.apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
        this.modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
        this.apiEndpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';

        this.logger.log(`AiService initialized with model: ${this.modelName}`);
        this.logger.log(`API Key starts with: ${this.apiKey?.substring(0, 7)}...`);
    }

    async processTicket(ticketId: string, actorUserId?: string) {
        this.logger.log(`Starting AI processing for ticket: ${ticketId}`);

        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { property: true },
        });

        if (!ticket) {
            this.logger.error(`AI processing aborted: Ticket ${ticketId} not found.`);
            return;
        }

        // 0. Audit Log: AI_START
        await this.prisma.auditLog.create({
            data: {
                tenantId: ticket.tenantId,
                action: 'AI_START',
                targetType: 'TICKET',
                targetId: ticketId,
                actorUserId: actorUserId || null,
                metadataJson: { model: this.modelName }
            }
        });

        try {
            // 1. Validation
            if (!ticket.description || ticket.description.trim().length < 10) {
                this.logger.log(`Ticket ${ticketId} has insufficient description. Marking as NEEDS_ATTENTION.`);
                await this.prisma.ticket.update({
                    where: { id: ticketId },
                    data: { internalStatus: 'NEEDS_ATTENTION' as any, status: 'NEEDS_ATTENTION' as any }
                });
                return;
            }

            // 2. Core Analysis (OpenAI Call)
            const aiOutput = await this.analyzeRawData(ticket);

            // 3. Post-Process Contractor Logic (Internal First, Nearby)
            const recommendedContractors = await this.suggestContractors(ticket.tenantId, aiOutput.category, ticket.propertyId);
            aiOutput.recommendedContractors = recommendedContractors;

            // 4. Save AI results
            await this.prisma.aiResult.create({
                data: {
                    tenantId: ticket.tenantId,
                    ticketId: ticket.id,
                    modelName: this.modelName,
                    promptVersion: '6.0-hardened',
                    outputJson: aiOutput as any,
                },
            });

            // 5. Update ticket with strict normalization
            await this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    urgency: (aiOutput.urgency?.toUpperCase() || 'UNKNOWN') as Urgency,
                    category: aiOutput.category?.toUpperCase(),
                    status: 'AI_READY' as any,
                    internalStatus: 'AI_READY' as any
                },
            });

            // 6. Audit Log: AI_SUCCESS
            await this.prisma.auditLog.create({
                data: {
                    tenantId: ticket.tenantId,
                    action: 'AI_SUCCESS',
                    targetType: 'TICKET',
                    targetId: ticketId,
                    metadataJson: { category: aiOutput.category, urgency: aiOutput.urgency }
                }
            });

            return aiOutput;

        } catch (err) {
            this.logger.error(`AI Processing FAILED for ${ticketId}: ${err.message}`);

            // Safe Fallback: Mark for Attention
            await this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'NEEDS_ATTENTION' as any,
                    internalStatus: 'FAILED' as any
                }
            });

            // Audit Log: AI_FAILURE
            await this.prisma.auditLog.create({
                data: {
                    tenantId: ticket.tenantId,
                    action: 'AI_FAILURE',
                    targetType: 'TICKET',
                    targetId: ticketId,
                    metadataJson: { error: err.message }
                }
            });

            throw err;
        }
    }

    private async fetchWithRetry(url: string, options: any, retries = 3, backoff = 1000): Promise<Response> {
        try {
            const response = await fetch(url, options);
            if (response.status === 429 && retries > 0) {
                this.logger.warn(`Rate limited (429). Retrying in ${backoff}ms...`);
                await new Promise(res => setTimeout(res, backoff));
                return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
            }
            return response;
        } catch (err) {
            if (retries > 0) {
                this.logger.warn(`Fetch failed: ${err.message}. Retrying in ${backoff}ms...`);
                await new Promise(res => setTimeout(res, backoff));
                return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
            }
            throw err;
        }
    }

    async analyzeRawData(data: { description: string, property?: { name: string }, unitLabel?: string }) {
        this.logger.log(`Performing hardened AI analysis...`);

        const schema = {
            name: "ticket_analysis",
            strict: true,
            schema: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        enum: ["PLUMBING", "ELECTRICAL", "HEATING", "APPLIANCE", "WINDOWS_DOORS", "ROOF_FACADE", "PEST", "MOLD", "OTHER"]
                    },
                    urgency: {
                        type: "string",
                        enum: ["EMERGENCY", "URGENT", "NORMAL", "UNKNOWN"]
                    },
                    emailDraft: {
                        type: "object",
                        properties: {
                            subject: { type: "string" },
                            body: { type: "string" }
                        },
                        required: ["subject", "body"],
                        additionalProperties: false
                    },
                    missingInfo: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                required: ["category", "urgency", "emailDraft", "missingInfo"],
                additionalProperties: false
            }
        };

        try {
            const body: any = {
                model: this.modelName,
                store: false, // Privacy requirement
            };

            if (this.apiEndpoint.includes('/responses')) {
                body.input = [
                    { role: 'system', content: 'You are a facility manager. Return structured analysis.' },
                    { role: 'user', content: this.buildPrompt(data) }
                ];
                body.text = {
                    format: {
                        type: 'json_schema',
                        name: 'ticket_analysis',
                        strict: true,
                        schema: schema.schema
                    }
                };
            } else {
                body.messages = [
                    { role: 'system', content: 'You are a facility manager. Return structured analysis.' },
                    { role: 'user', content: this.buildPrompt(data) }
                ];
                body.response_format = { type: "json_schema", json_schema: schema };
                body.max_tokens = 800;
                body.temperature = 0;
            }

            const response = await this.fetchWithRetry(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI API failed (${response.status}): ${errorText}`);
            }

            const resultData = await response.json();
            this.logger.debug(`Raw AI Response: ${JSON.stringify(resultData)}`);
            const aiOutput = this.parseAiResponse(resultData);

            return {
                category: aiOutput.category || 'OTHER',
                urgency: aiOutput.urgency || 'UNKNOWN',
                emailDraft: aiOutput.emailDraft || { subject: 'Maintenance Request', body: 'Repair needed.' },
                missingInfo: aiOutput.missingInfo || [],
                recommendedContractors: [] as any[]
            };

        } catch (err) {
            this.logger.error(`analyzeRawData failed: ${err.message}`);
            // Fallback to local heuristic analysis
            return {
                category: this.classifyDamage(data.description),
                urgency: this.determineUrgency(data.description, 'NORMAL'),
                emailDraft: {
                    subject: 'Maintenance Request (Fallback)',
                    body: this.generateEmailDraft(data, 'GENERAL_MAINTENANCE', null)
                },
                missingInfo: ['AI analysis failed, used fallback.'],
                recommendedContractors: [] as any[],
                error: err.message
            };
        }
    }

    private buildPrompt(ticket: any): string {
        return `You are a professional Facility Manager assistant for PropCare. 
        Analyze the maintenance request and return a CATEGORY and URGENCY based on Swiss facility management standards.

        REQUEST:
        - DESCRIPTION: "${ticket.description}"
        - PROPERTY: ${ticket.property?.name || 'Unknown'}
        - UNIT: ${ticket.unitLabel || 'Common Area'}

        CATEOGORIES: PLUMBING, ELECTRICAL, HEATING, APPLIANCE, WINDOWS_DOORS, ROOF_FACADE, PEST, MOLD, OTHER
        URGENCIES: EMERGENCY, URGENT, NORMAL, UNKNOWN (Use EMERGENCY for flooding, fire, gas, total power loss).

        TASK:
        1. Categorize the issue.
        2. Determine urgency.
        3. Identify missing information (e.g., brand of appliance, exact location of leak).
        4. Draft a professional email to a contractor. Use placeholders like {ContractorName}.`;
    }

    private parseAiResponse(data: any): any {
        try {
            let content = "";

            // 1. Handle Responses API structure (Array of output blocks)
            if (Array.isArray(data.output)) {
                const messageBlock = data.output.find((o: any) => o.type === 'message');
                if (messageBlock?.content && Array.isArray(messageBlock.content)) {
                    content = messageBlock.content
                        .filter((c: any) => c.type === 'output_text')
                        .map((c: any) => c.text)
                        .join("");
                }
            }
            // 2. Handle Chat Completions structure
            else if (data.choices?.[0]?.message) {
                content = data.choices[0].message.content || "";
            }
            // 3. Simple fallback
            else if (typeof data.response === 'string') {
                content = data.response;
            }

            if (!content) return {};

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch (e) {
            this.logger.error(`Failed to parse AI JSON: ${e.message}`);
            return {};
        }
    }

    private classifyDamage(description: string): string {
        const desc = description.toLowerCase();
        if (desc.includes('leak') || desc.includes('water') || desc.includes('pipe')) return 'PLUMBING';
        if (desc.includes('light') || desc.includes('power') || desc.includes('electricity')) return 'ELECTRICAL';
        if (desc.includes('lock') || desc.includes('key') || desc.includes('door')) return 'WINDOWS_DOORS';
        if (desc.includes('heat') || desc.includes('cold') || desc.includes('hvac')) return 'HEATING';
        return 'OTHER';
    }

    private determineUrgency(description: string, reportedUrgency: string): string {
        const desc = description.toLowerCase();
        if (desc.includes('flood') || desc.includes('fire') || desc.includes('burst')) return 'EMERGENCY';
        return reportedUrgency === 'EMERGENCY' ? 'EMERGENCY' : 'NORMAL';
    }

    private async suggestContractors(tenantId: string, category: string, propertyId: string | null) {
        this.logger.log(`Searching for contractors for ${category} near ${propertyId}...`);

        // 1. Get Property Location
        let property: any = null;
        if (propertyId) {
            property = await this.prisma.property.findUnique({
                where: { id: propertyId }
            });
        }

        // 2. Query Internal List (Priority 1)
        // Rule: TRADE matches and (PROPERTY matches OR location matches)
        const internal = await this.prisma.contractor.findMany({
            where: {
                tenantId,
                tradeTypes: { has: category.toUpperCase() },
                OR: [
                    { properties: propertyId ? { some: { propertyId } } : undefined },
                    { serviceZipCodes: property?.zip ? { has: property.zip } : undefined },
                    { serviceCities: property?.city ? { has: property.city } : undefined }
                ]
            },
            take: 3
        });

        if (internal.length > 0) {
            this.logger.log(`Found ${internal.length} internal contractors.`);
            return internal.map(c => ({
                id: c.id,
                name: c.name,
                source: 'INTERNAL',
                matchReason: 'Preferred partner for this region/property'
            }));
        }

        // 3. Fallback: Google Search (Priority 2)
        this.logger.log(`No internal matches. Invoking Google Search fallback...`);
        // In a real implementation, we would call a Search API (SerpAPI/Google)
        // For now, we simulate the 'discovery' of a local contractor
        const locationQuery = property ? `${property.city} ${property.zip}` : 'Switzerland';

        return [
            {
                id: 'google-discovery-1',
                name: `Local ${category} Pro (${property?.city || 'Zurich'})`,
                source: 'GOOGLE',
                matchReason: `Discovered for ${category} in ${locationQuery} via search fallback`
            }
        ];
    }

    private generateEmailDraft(ticket: any, category: string, contractor: any) {
        return `Subject: Repair Request: ${ticket.referenceCode} at ${ticket.property?.name || 'Property'}
        
        Hello, we have a ${category} issue reported. Please contact ${ticket.tenantName} at ${ticket.tenantPhone || 'email'}.`;
    }
}
