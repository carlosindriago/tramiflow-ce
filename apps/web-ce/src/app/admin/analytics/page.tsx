import { createClient } from '@tramiflow/database/server'
import { subDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AnalyticsCharts } from './analytics-charts'

export default async function AdminAnalyticsPage() {
    const supabase = await createClient()

    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Top tools this month
    const { data: rawEvents } = await supabase
        .from('usage_logs')
        .select('event_name')
        .gte('created_at', firstOfMonth.toISOString())

    const eventCounts: Record<string, number> = {}
    rawEvents?.forEach(e => {
        eventCounts[e.event_name] = (eventCounts[e.event_name] ?? 0) + 1
    })
    const topEvents = Object.entries(eventCounts)
        .map(([event_name, count]) => ({ event_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

    // Trend: last 30 days aggregated per day
    const { data: trendRaw } = await supabase
        .from('usage_logs')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())

    const dayCounts: Record<string, number> = {}
    trendRaw?.forEach(ev => {
        const day = format(new Date(ev.created_at), 'dd MMM', { locale: es })
        dayCounts[day] = (dayCounts[day] ?? 0) + 1
    })

    const trendData: { day: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
        const d = subDays(now, i)
        const key = format(d, 'dd MMM', { locale: es })
        trendData.push({ day: key, count: dayCounts[key] ?? 0 })
    }

    // Top orgs by event count
    const { data: orgEvents } = await supabase
        .from('usage_logs')
        .select('organization_id, organizations(name)')
        .gte('created_at', firstOfMonth.toISOString())
        .not('organization_id', 'is', null)

    const orgCounts: Record<string, { name: string; count: number }> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ; (orgEvents as any[])?.forEach((ev) => {
            if (!ev.organization_id) return
            const orgName = Array.isArray(ev.organizations)
                ? (ev.organizations[0]?.name ?? ev.organization_id.slice(0, 8))
                : (ev.organizations?.name ?? ev.organization_id.slice(0, 8))
            if (!orgCounts[ev.organization_id]) orgCounts[ev.organization_id] = { name: orgName, count: 0 }
            orgCounts[ev.organization_id].count++
        })
    const topOrgs = Object.values(orgCounts).sort((a, b) => b.count - a.count).slice(0, 5)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Analytics de Uso</h1>
                <p className="text-muted-foreground text-sm mt-1">Métricas de uso de herramientas y actividad general.</p>
            </div>

            {/* All charts rendered in a single client component */}
            <AnalyticsCharts
                topEvents={topEvents}
                trendData={trendData}
                topOrgs={topOrgs}
            />
        </div>
    )
}
