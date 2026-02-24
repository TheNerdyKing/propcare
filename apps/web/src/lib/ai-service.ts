import { createClient } from '@supabase/supabase-js';
import { AIAnalysisSchema, AIAnalysis } from '@propcare/shared';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for backend operations

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export async function processTicketAi(ticketId: string) {
    console.log(`[AI] Starting analysis for ticket: ${ticketId}`);

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

        // 2. Update status to PROCESSING
        await supabase
            .from('tickets')
            .update({ ai_status: 'PROCESSING' })
            .eq('id', ticketId);

        // 3. Perform AI Analysis
        const aiOutput = await analyzeWithOpenAi(ticket);

        // 4. Suggest Contractors (Internal First)
        const recommendedContractors = await suggestContractors(ticket.tenant_id, aiOutput.classification.category, ticket.property_id, ticket.property);
        aiOutput.recommendedContractors = recommendedContractors;

        // 5. Save AI Results
        await supabase
            .from('ai_results')
            .insert({
                tenant_id: ticket.tenant_id,
                ticket_id: ticket.id,
                model_name: OPENAI_MODEL,
                prompt_version: '8.0-web-native',
                output_json: aiOutput
            });

        // 6. Final Ticket Update
        await supabase
            .from('tickets')
            .update({
                urgency: aiOutput.classification.urgency,
                category: aiOutput.classification.category,
                ai_status: 'AI_READY',
                last_ai_run_at: new Date().toISOString()
            })
            .eq('id', ticketId);

        console.log(`[AI] Successfully processed ticket: ${ticketId}`);
        return aiOutput;

    } catch (err: any) {
        console.error(`[AI] Failed for ${ticketId}:`, err.message);
        await supabase
            .from('tickets')
            .update({ ai_status: 'FAILED' })
            .eq('id', ticketId);
        throw err;
    }
}

async function analyzeWithOpenAi(ticket: any): Promise<AIAnalysis> {
    const prompt = `You are a professional Facility Manager for PropCare. 
    Analyze the maintenance request and return structured JSON.

    REQUEST:
    - DESCRIPTION: "${ticket.description}"
    - PROPERTY: ${ticket.property?.name || 'Unknown'}
    - UNIT: ${ticket.unit_label || 'Common Area'}

    REQUIRED JSON STRUCTURE:
    {
      "version": "1.0",
      "classification": {
        "category": "PLUMBING" | "ELECTRICAL" | "HEATING" | "APPLIANCE" | "OTHER",
        "urgency": "EMERGENCY" | "URGENT" | "NORMAL" | "UNKNOWN",
        "confidence": 0.95
      },
      "ticketState": { "inferred": "NEW", "reason": "..." },
      "missingInfo": ["..."],
      "recommendedContractors": [],
      "draftEmail": { "subject": "...", "bodyText": "...", "bodyHtml": "..." },
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
                { role: 'system', content: 'Return valid JSON only.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API Error: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return AIAnalysisSchema.parse(JSON.parse(content));
}

async function suggestContractors(tenantId: string, category: string, propertyId: string, property: any) {
    // 1. Check internal contractors for this tenant and trade
    const { data: internal } = await supabase
        .from('contractors')
        .select('*')
        .eq('tenant_id', tenantId)
        .contains('trade_types', [category.toUpperCase()])
        .limit(3);

    if (internal && internal.length > 0) {
        return internal.map(c => ({
            source: 'INTERNAL',
            contractorId: c.id,
            name: c.name,
            reason: 'Preferred provider in your service network'
        }));
    }

    // 2. Fallback to placeholder discovery
    return [{
        source: 'GOOGLE',
        name: `Local ${category} Specialist`,
        reason: `Discovered for ${property?.city || 'the region'} via PropCare Network`
    }];
}
