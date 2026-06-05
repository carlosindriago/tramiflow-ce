'use client'

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid,
} from 'recharts'

interface EventCount { event_name: string; count: number }
interface DayCount { day: string; count: number }
interface OrgCount { name: string; count: number }

interface AnalyticsChartsProps {
    topEvents: EventCount[]
    trendData: DayCount[]
    topOrgs: OrgCount[]
}

const CHART_COLORS = { bar: '#8b5cf6', line: '#06b6d4' }

const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
    fontSize: 12,
}

export function AnalyticsCharts({ topEvents, trendData, topOrgs }: AnalyticsChartsProps) {
    return (
        <>
            {/* Top Tools Bar Chart */}
            {topEvents.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={topEvents} layout="vertical" margin={{ left: 16 }}>
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="transparent" />
                        <YAxis type="category" dataKey="event_name" width={180} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" fill={CHART_COLORS.bar} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-sm text-muted-foreground">Sin datos este mes.</p>
            )}

            {/* Trend Line Chart */}
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="count" stroke={CHART_COLORS.line} strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>

            {/* Top Orgs Table */}
            {topOrgs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos este mes.</p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-muted-foreground border-b border-border/30">
                            <th className="text-left pb-2">#</th>
                            <th className="text-left pb-2">Organización</th>
                            <th className="text-right pb-2">Eventos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {topOrgs.map((org, i) => (
                            <tr key={org.name}>
                                <td className="py-2 text-muted-foreground">{i + 1}</td>
                                <td className="py-2 font-medium">{org.name}</td>
                                <td className="py-2 text-right tabular-nums">{org.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    )
}
