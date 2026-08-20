/**
 * Types for template analytics
 */

export interface ChartDataPoint {
    date: string
    views: number
    leads: number
}

export interface RecentLead {
    id: string
    name: string
    phone: string
    email: string | null
    created_at: string | null
}

export interface TemplateClone {
    id: string
    organization_name: string | null
    country: string | null
    created_at: string | null
}

export interface TemplateAnalytics {
    totalViews: number
    totalLeads: number
    conversionRate: number
    recentLeads: RecentLead[]
    clones: TemplateClone[]
    chartData: ChartDataPoint[]
}

export interface TemplateAnalyticsResponse {
    success: boolean
    data?: TemplateAnalytics
    error?: string
}
