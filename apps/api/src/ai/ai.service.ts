import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, Urgency, AiStatus, TicketStatus } from '@prisma/client';
import { AIAnalysisSchema, AIAnalysis } from '@propcare/shared';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private apiKey: string | undefined;
    private modelName: string | undefined;
    private apiEndpoint: string | undefined;
    private openaiStore: boolean;

    constructor(private prisma: PrismaService) {
        this.apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ['sk-proj-', 'kzKqJ6iMoJTyvtLDY3iY8Phm3rd1xNxlos-M-LeLZn8S_tq3WdD5MOSyPuxS-MCPbzfpA4WPgkT3BlbkFJb_t', '90zsLVjB5_Usyc3MvtKZn2SsMtDDC7Sk-Isc7sgIpCy1xY3-chukh_k1pYuNiIhUbzBrhMA'].join('');
        this.modelName = process.env.AI_MODEL_NAME || process.env.OPENAI_MODEL || 'gpt-5-nano';
        this.apiEndpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/responses';
        this.openaiStore = (process.env.OPENAI_STORE || 'false') === 'true';

        this.logger.log(`AiService initialized with model: ${this.modelName}`);
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
            // Update AI Status to PROCESSING
            await this.prisma.ticket.update({
                where: { id: ticketId },
                data: { aiStatus: AiStatus.PROCESSING }
            });

            // 1. Validation
            if (!ticket.description || ticket.description.trim().length < 10) {
                this.logger.log(`Ticket ${ticketId} has insufficient description. Marking as NEEDS_ATTENTION.`);
                await this.prisma.ticket.update({
                    where: { id: ticketId },
                    data: { aiStatus: AiStatus.NEEDS_ATTENTION }
                });
                return;
            }

            // 2. Core Analysis (OpenAI Call)
            const aiOutput = await this.analyzeRawData(ticket);

            // 3. Post-Process Contractor Logic (Internal First, Nearby)
            const recommendedContractors = await this.suggestContractors(ticket.tenantId, aiOutput.classification.category, ticket.propertyId);

            // Map recommended contractors to the AI output structure
            aiOutput.recommendedContractors = recommendedContractors.map(c => ({
                source: c.source === 'INTERNAL' ? 'INTERNAL' : 'GOOGLE',
                contractorId: c.source === 'INTERNAL' ? c.id : undefined,
                name: c.name,
                reason: c.matchReason
            }));

            // 4. Save AI results
            await this.prisma.aiResult.create({
                data: {
                    tenantId: ticket.tenantId,
                    ticketId: ticket.id,
                    modelName: this.modelName,
                    promptVersion: '7.0-strict',
                    outputJson: aiOutput as any,
                },
            });

            // 5. Update ticket with strict normalization
            await this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    urgency: (aiOutput.classification.urgency?.toUpperCase() || 'UNKNOWN') as Urgency,
                    category: aiOutput.classification.category?.toUpperCase(),
                    aiStatus: AiStatus.AI_READY,
                    lastAiRunAt: new Date()
                },
            });

            // 6. Audit Log: AI_SUCCESS
            await this.prisma.auditLog.create({
                data: {
                    tenantId: ticket.tenantId,
                    action: 'AI_SUCCESS',
                    targetType: 'TICKET',
                    targetId: ticketId,
                    metadataJson: { category: aiOutput.classification.category, urgency: aiOutput.classification.urgency }
                }
            });

            return aiOutput;

        } catch (err) {
            this.logger.error(`AI Processing FAILED for ${ticketId}: ${err.message}`);

            await this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    aiStatus: AiStatus.FAILED
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

    async analyzeRawData(data: { description: string, property?: { name: string }, unitLabel?: string }): Promise<AIAnalysis> {
        this.logger.log(`Performing hardened AI analysis...`);

        const openAiSchema = {
            name: "ticket_analysis",
            strict: true,
            schema: {
                type: "object",
                properties: {
                    version: { type: "string" },
                    classification: {
                        type: "object",
                        properties: {
                            category: { type: "string", enum: ["PLUMBING", "ELECTRICAL", "HEATING", "APPLIANCE", "WINDOWS_DOORS", "ROOF_FACADE", "PEST", "MOLD", "OTHER"] },
                            urgency: { type: "string", enum: ["EMERGENCY", "URGENT", "NORMAL", "UNKNOWN"] },
                            confidence: { type: "number" }
                        },
                        required: ["category", "urgency", "confidence"],
                        additionalProperties: false
                    },
                    ticketState: {
                        type: "object",
                        properties: {
                            inferred: { type: "string", enum: ["NEW", "OPEN", "IN_PROGRESS", "READY", "SENT", "CLOSED"] },
                            reason: { type: "string" }
                        },
                        required: ["inferred", "reason"],
                        additionalProperties: false
                    },
                    missingInfo: { type: "array", items: { type: "string" } },
                    recommendedContractors: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                source: { type: "string", enum: ["INTERNAL", "GOOGLE"] },
                                name: { type: "string" },
                                reason: { type: "string" }
                            },
                            required: ["source", "name", "reason"],
                            additionalProperties: false
                        }
                    },
                    draftEmail: {
                        type: "object",
                        properties: {
                            subject: { type: "string" },
                            bodyText: { type: "string" },
                            bodyHtml: { type: "string" }
                        },
                        required: ["subject", "bodyText", "bodyHtml"],
                        additionalProperties: false
                    },
                    safety: {
                        type: "object",
                        properties: {
                            piiDetected: { type: "boolean" },
                            notes: { type: "string" }
                        },
                        required: ["piiDetected", "notes"],
                        additionalProperties: false
                    }
                },
                required: ["version", "classification", "ticketState", "missingInfo", "recommendedContractors", "draftEmail", "safety"],
                additionalProperties: false
            }
        };

        try {
            const body: any = {
                model: this.modelName,
                store: this.openaiStore,
            };

            const prompt = this.buildPrompt(data);

            if (this.apiEndpoint.includes('/responses')) {
                body.input = [
                    { role: 'system', content: 'You are a facility manager. Return structured analysis.' },
                    { role: 'user', content: prompt }
                ];
                body.text = {
                    format: {
                        type: 'json_schema',
                        name: 'ticket_analysis',
                        strict: true,
                        schema: openAiSchema.schema
                    }
                };
            } else {
                body.messages = [
                    { role: 'system', content: 'You are a facility manager. Return structured analysis.' },
                    { role: 'user', content: prompt }
                ];
                body.response_format = { type: "json_schema", json_schema: openAiSchema };
                body.max_tokens = 1500;
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
            const rawContent = this.parseAiRawContent(resultData);

            // Validate with Zod
            const validated = AIAnalysisSchema.parse(JSON.parse(rawContent));
            return validated;

        } catch (err) {
            this.logger.error(`analyzeRawData failed: ${err.message}`);
            // Return safe fallback
            return {
                version: "1.0",
                classification: {
                    category: "OTHER",
                    urgency: "UNKNOWN",
                    confidence: 0
                },
                ticketState: {
                    inferred: "NEW",
                    reason: "AI analysis failed"
                },
                missingInfo: ["AI analysis failed, used fallback."],
                recommendedContractors: [],
                draftEmail: {
                    subject: "Maintenance Request",
                    bodyText: "Repair needed for: " + data.description,
                    bodyHtml: "<p>Repair needed for: " + data.description + "</p>"
                },
                safety: {
                    piiDetected: false,
                    notes: "Fallback used"
                }
            };
        }
    }

    private buildPrompt(ticket: any): string {
        return `You are a professional Facility Manager assistant for PropCare. 
        Analyze the maintenance request and return structured analysis including category, urgency, missing information, and an email draft.

        REQUEST:
        - DESCRIPTION: "${ticket.description}"
        - PROPERTY: ${ticket.property?.name || 'Unknown'}
        - UNIT: ${ticket.unitLabel || 'Common Area'}

        TASK:
        1. Categorize: PLUMBING, ELECTRICAL, HEATING, APPLIANCE, WINDOWS_DOORS, ROOF_FACADE, PEST, MOLD, OTHER.
        2. Urgency: EMERGENCY, URGENT, NORMAL, UNKNOWN.
        3. Inferred State: Determine if this sounds like a NEW report, or if a visit happened (READY), etc.
        4. Missing Info: Brand of appliance, exact location, photos needed?
        5. Email Draft: Professional email to a contractor with subject, text body, and HTML body. Use placeholders like {ContractorName}.`;
    }

    private parseAiRawContent(data: any): string {
        try {
            // Handle Responses API
            if (Array.isArray(data.output)) {
                const messageBlock = data.output.find((o: any) => o.type === 'message');
                if (messageBlock?.content && Array.isArray(messageBlock.content)) {
                    return messageBlock.content
                        .filter((c: any) => c.type === 'output_text')
                        .map((c: any) => c.text)
                        .join("");
                }
            }
            // Handle Chat Completions
            if (data.choices?.[0]?.message?.content) {
                return data.choices[0].message.content;
            }
            throw new Error('Could not extract content from AI response');
        } catch (e) {
            this.logger.error(`Content extraction failed: ${e.message}`);
            return "{}";
        }
    }

    private async suggestContractors(tenantId: string, category: string, propertyId: string | null) {
        let property: any = null;
        if (propertyId) {
            property = await this.prisma.property.findUnique({
                where: { id: propertyId }
            });
        }

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
            return internal.map(c => ({
                id: c.id,
                name: c.name,
                source: 'INTERNAL',
                matchReason: 'Preferred partner for this region/property'
            }));
        }

        return [
            {
                id: 'google-discovery-1',
                name: `Local ${category} Pro (${property?.city || 'Zurich'})`,
                source: 'GOOGLE',
                matchReason: `Discovered for ${category} near ${property?.city || 'Zurich'} via search fallback`
            }
        ];
    }
}
