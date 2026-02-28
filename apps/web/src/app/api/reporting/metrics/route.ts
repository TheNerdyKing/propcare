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
        const propertyId = searchParams.get('propertyId');

        if (!tenantId) {
            return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Fetch all tickets for the tenant to calculate metrics
        let query = supabase
            .from('tickets')
            .select('id, status, urgency, updatedAt, createdAt, cost_estimate_chf, category, closed_at, property_id')
            .eq('tenant_id', tenantId);

        if (propertyId && propertyId !== 'all') {
            query = query.eq('property_id', propertyId);
        }

        const { data: tickets, error } = await query;

        if (error) {
            console.error('[API] Analytics fetch error:', error);
            throw error;
        }

        // Fetch property count for the tenant
        const { count: propertyCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const currentMonthTickets = tickets.filter(t => new Date(t.createdAt).getTime() >= thirtyDaysAgo.getTime());
        const previousMonthTickets = tickets.filter(t => {
            const time = new Date(t.createdAt).getTime();
            return time >= sixtyDaysAgo.getTime() && time < thirtyDaysAgo.getTime();
        });

        // Resolution Time Calculation
        const closedTickets = tickets.filter(t => t.closed_at);
        const avgResolutionTimeMs = closedTickets.length > 0
            ? closedTickets.reduce((acc, t) => {
                const start = new Date(t.createdAt).getTime();
                const end = new Date(t.closed_at).getTime();
                return acc + (end - start);
            }, 0) / closedTickets.length
            : 0;

        const avgResolutionTimeDays = (avgResolutionTimeMs / (1000 * 60 * 60 * 24)).toFixed(1);

        // Cost Calculation
        const totalCost = tickets.reduce((acc, t) => acc + (Number(t.cost_estimate_chf) || 0), 0);
        const avgCost = tickets.length > 0 ? totalCost / tickets.length : 0;

        // Trend
        const trend = previousMonthTickets.length > 0
            ? ((currentMonthTickets.length - previousMonthTickets.length) / previousMonthTickets.length) * 100
            : 0;

        // Daily data for last 7 days
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });

        const timeSeriesData = last7Days.map(date => {
            const dateStr = date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
            const count = tickets.filter(t => {
                const tDate = new Date(t.createdAt);
                return tDate.getDate() === date.getDate() && tDate.getMonth() === date.getMonth();
            }).length;
            return { date: dateStr, count };
        });

        // Category Distribution mapping to the UI list
        const categories = {
            'SANITARY': 'Sanitär',
            'ELECTRICAL': 'Elektrik',
            'HEATING': 'Heizung',
            'WINDOWS_DOORS': 'Fenster',
            'OTHER': 'Sonstiges'
        };

        const categoryStats = tickets.reduce((acc: any, t) => {
            const cat = t.category || 'OTHER';
            const mappedCat = categories[cat as keyof typeof categories] || 'Sonstiges';
            acc[mappedCat] = (acc[mappedCat] || 0) + 1;
            return acc;
        }, {});

        // Ensure all categories are present for the chart
        const categoryData = Object.values(categories).map(catName => ({
            name: catName,
            count: categoryStats[catName] || 0
        }));

        const completedCount = tickets.filter(t => t.status === 'CLOSED' || t.status === 'SENT').length;
        const efficiency = tickets.length > 0 ? (completedCount / tickets.length) * 100 : 0;

        return NextResponse.json({
            total: tickets.length,
            new: tickets.filter(t => t.status === 'NEW').length,
            inProgress: tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'OPEN').length,
            completed: completedCount,
            emergency: tickets.filter(t => t.urgency === 'EMERGENCY' || t.urgency === 'URGENT').length,
            avgResolutionTime: `${avgResolutionTimeDays} Tage`,
            totalCost: totalCost,
            avgCost: avgCost,
            trend: trend.toFixed(1),
            timeSeriesData,
            categoryData,
            propertyCount: propertyCount || 0,
            efficiency: efficiency.toFixed(0)
        });

    } catch (error: any) {
        console.error('[API] Reporting Metrics Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
