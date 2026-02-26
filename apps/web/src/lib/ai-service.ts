import { createClient } from '@supabase/supabase-js';
import { AIAnalysisSchema, AIAnalysis } from '@propcare/shared';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
}

const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export async function processTicketAi(ticketId: string) {
    console.log(`[AI] Starting analysis for ticket: ${ticketId}`);
    const supabase = getSupabase();

    try {
        // 1. Fetch Ticket
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select('*, property:properties(name, city, zip)')
            .eq('id', ticketId)
            .single();

        if (ticketError || !ticket) {
            throw new Error(`Ticket ${ticketId} not found.`);
        }

        // 2. Update status to PROCESSING & Log Start
        await supabase
            .from('tickets')
            .update({ ai_status: 'PROCESSING' })
            .eq('id', ticketId);

        await supabase
            .from('audit_logs')
            .insert({
                tenant_id: ticket.tenant_id,
                action: 'AI_START',
                target_type: 'TICKET',
                target_id: ticketId,
                metadata_json: { 
                    model: OPENAI_MODEL,
                    details: 'KI-Analyse remote gestartet' 
                }
            });

        // 3. Perform AI Analysis
        const aiOutput = await analyzeWithOpenAi(ticket);

        // 4. Suggest Contractors (Internal First)
        const recommendedContractors = await suggestContractors(ticket.tenant_id, aiOutput.classification.category, ticket.property_id || '', ticket.property);
        aiOutput.recommendedContractors = recommendedContractors;

        // 5. Save AI Results
        await supabase
            .from('ai_results')
            .insert({
                tenant_id: ticket.tenant_id,
                ticket_id: ticket.id,
                model_name: OPENAI_MODEL,
                prompt_version: '8.1-german-native',
                output_json: aiOutput
            });

        // 6. Final Ticket Update & Log Success
        await supabase
            .from('tickets')
            .update({
                urgency: aiOutput.classification.urgency,
                category: aiOutput.classification.category,
                ai_status: 'AI_READY',
                last_ai_run_at: new Date().toISOString()
            })
            .eq('id', ticketId);

        await supabase
            .from('audit_logs')
            .insert({
                tenant_id: ticket.tenant_id,
                action: 'AI_SUCCESS',
                target_type: 'TICKET',
                target_id: ticketId,
                metadata_json: {
                    category: aiOutput.classification.category,
                    urgency: aiOutput.classification.urgency,
                    details: `KI-Klassifizierung erfolgreich: ${aiOutput.classification.category}`
                }
            });

        console.log(`[AI] Successfully processed ticket: ${ticketId}`);
        return aiOutput;

    } catch (err: any) {
        console.error(`[AI] Failed for ${ticketId}:`, err.message);

        const { data: fallbackTicket } = await supabase.from('tickets').select('tenant_id').eq('id', ticketId).single();

        await supabase
            .from('tickets')
            .update({ ai_status: 'FAILED' })
            .eq('id', ticketId);

        if (fallbackTicket) {
            await supabase
                .from('audit_logs')
                .insert({
                    tenant_id: fallbackTicket.tenant_id,
                    action: 'AI_FAILED',
                    target_type: 'TICKET',
                    target_id: ticketId,
                    metadata_json: { 
                        error: err.message,
                        details: `KI-Analyse fehlgeschlagen: ${err.message}`
                    }
                });
        }
        throw err;
    }
}

async function analyzeWithOpenAi(ticket: any): Promise<AIAnalysis> {
    const prompt = `You are a professional Facility Manager for PropCare in Switzerland/Germany. 
    Analyze the maintenance request and return structured JSON.
    IMPORTANT: All text content like 'draftEmail' subject and body MUST be in GERMAN.
    The response must be in valid JSON.

    REQUEST:
    - DESCRIPTION: "${ticket.description}"
    - PROPERTY: ${ticket.property?.name || 'Unbekannt'}
    - UNIT: ${ticket.unit_label || 'Allgemein'}

    REQUIRED JSON STRUCTURE:
    {
      "version": "1.0",
      "classification": {
        "category": "PLUMBING" | "ELECTRICAL" | "HEATING" | "APPLIANCE" | "OTHER",
        "urgency": "EMERGENCY" | "URGENT" | "NORMAL" | "UNKNOWN",
        "confidence": 0.95
      },
      "ticketState": { "inferred": "NEW", "reason": "..." },
      "missingInfo": ["In German..."],
      "recommendedContractors": [],
      "draftEmail": { "subject": "In German...", "bodyText": "In German...", "bodyHtml": "In German..." },
      "safety": { "piiDetected": false, "notes": "..." }
    }`;

    const response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [
                { role: 'system', content: 'Return valid JSON only. All generated text must be in German.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API Error: ${await response.text()}`);
    }

    const json = await response.json();
    const content = json.choices[0].message.content;
    return AIAnalysisSchema.parse(JSON.parse(content));
}

async function suggestContractors(tenantId: string, category: string, propertyId: string, property: any) {
    const supabase = getSupabase();
    const { data: internal } = await supabase
        .from('contractors')
        .select('*')
        .eq('tenant_id', tenantId)
        .contains('trade_types', [category.toUpperCase()])
        .limit(3);

    if (internal && internal.length > 0) {
        return internal.map(c => ({
            source: 'INTERNAL' as const,
            contractorId: c.id,
            name: c.name,
            email: c.email,
            reason: 'Bevorzugter Partner in Ihrem Netzwerk'
        }));
    }

    return [{
        source: 'GOOGLE' as const,
        name: `Lokaler ${category} Spezialist`,
        reason: `Gefunden für ${property?.city || 'die Region'} über PropCare Netzwerk`
    }];
}
