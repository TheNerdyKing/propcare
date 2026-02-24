import { NextRequest, NextResponse } from 'next/server';
import { processTicketAi } from '@/lib/ai-service';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        console.log(`[API] Triggering AI analysis for ticket ${id}`);
        const result = await processTicketAi(id);
        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error(`[API] Analysis failed for ${id}:`, error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
