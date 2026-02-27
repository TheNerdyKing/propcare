import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Fetch all tickets for the tenant to calculate metrics
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('status, urgency, updatedAt, createdAt, cost_estimate_chf, category, closed_at')
            .eq('tenant_id', tenantId);

        if (error) {
            console.error('[API] Analytics fetch error:', error);
            throw error;
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const currentMonthTickets = tickets.filter(t => new Date(t.createdAt || t.created_at) >= thirtyDaysAgo);
        const previousMonthTickets = tickets.filter(t => new Date(t.createdAt || t.created_at) >= sixtyDaysAgo && new Date(t.createdAt || t.created_at) < thirtyDaysAgo);

        // Resolution Time Calculation
        const closedTickets = tickets.filter(t => t.closed_at);
        const avgResolutionTimeMs = closedTickets.length > 0
            ? closedTickets.reduce((acc, t) => {
                const start = new Date(t.createdAt || t.created_at).getTime();
                const end = new Date(t.closed_at).getTime();
                return acc + (end - start);
            }, 0) / closedTickets.length
            : 0;

        const avgResolutionTimeDays = (avgResolutionTimeMs / (1000 * 60 * 60 * 24)).toFixed(1);

        // Cost Calculation
        const totalCost = tickets.reduce((acc, t) => acc + (Number(t.cost_estimate_chf) || 0), 0);

        // Trend
        const trend = previousMonthTickets.length > 0
            ? ((currentMonthTickets.length - previousMonthTickets.length) / previousMonthTickets.length) * 100
            : 0;

        return NextResponse.json({
            total: tickets.length,
            new: tickets.filter(t => t.status === 'NEW').length,
            inProgress: tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'OPEN').length,
            completed: tickets.filter(t => t.status === 'CLOSED' || t.status === 'SENT').length,
            emergency: tickets.filter(t => t.urgency === 'EMERGENCY').length,
            avgResolutionTime: `${avgResolutionTimeDays} Tage`,
            totalCost: totalCost.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' }),
            trend: trend.toFixed(1),
            categoryDistribution: tickets.reduce((acc: any, t) => {
                const cat = t.category || 'Unkategorisiert';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {})
        });

    } catch (error: any) {
        console.error('[API] Reporting Metrics Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
