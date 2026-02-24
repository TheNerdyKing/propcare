import { z } from 'zod';

export const AIAnalysisSchema = z.object({
    version: z.string().default("1.0"),
    classification: z.object({
        category: z.enum([
            "PLUMBING",
            "ELECTRICAL",
            "HEATING",
            "APPLIANCE",
            "WINDOWS_DOORS",
            "ROOF_FACADE",
            "PEST",
            "MOLD",
            "OTHER"
        ]),
        urgency: z.enum(["EMERGENCY", "URGENT", "NORMAL", "UNKNOWN"]),
        confidence: z.number().min(0).max(1),
    }),
    ticketState: z.object({
        inferred: z.enum(["NEW", "OPEN", "IN_PROGRESS", "READY", "SENT", "CLOSED"]),
        reason: z.string()
    }),
    missingInfo: z.array(z.string()),
    recommendedContractors: z.array(z.object({
        source: z.enum(["INTERNAL", "GOOGLE"]),
        contractorId: z.string().optional(),
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        distanceKm: z.number().optional(),
        reason: z.string()
    })),
    draftEmail: z.object({
        subject: z.string(),
        bodyText: z.string(),
        bodyHtml: z.string()
    }),
    safety: z.object({
        piiDetected: z.boolean(),
        notes: z.string()
    })
});

export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;
