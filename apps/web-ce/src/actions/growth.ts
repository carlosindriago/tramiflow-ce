'use server'

import { createClient } from '@carlosindriago/database/server'
import { headers } from 'next/headers'
import { leadCaptureSchema, RATE_LIMITS, actionSuccess, actionError } from '@carlosindriago/core'
import { userAgent } from 'next/server'
import { rateLimit } from '@carlosindriago/core/server'
import { createOrgAction } from '@/lib/action-helpers'

// --- Actions for Public View ---

export async function trackView(templateId: string) {
    const supabase = await createClient()

    // 🔒 SECURITY: Rate limiting to prevent spam
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const identifier = `view:${templateId}:${ip}`

    const rateLimitResult = await rateLimit(
        identifier,
        RATE_LIMITS.VIEW_TRACKING.limit,
        RATE_LIMITS.VIEW_TRACKING.window
    )

    // Fail silently if rate limited (don't leak rate limit info)
    if (!rateLimitResult.success) {
        return
    }

    // Get device type from user agent
    const ua = userAgent({ headers: headersList })
    const deviceType = ua.device.type || 'desktop' // 'mobile', 'tablet', or undefined (desktop)

    const { error } = await supabase
        .from('template_views')
        .insert({
            template_id: templateId,
            device_type: deviceType,
        })

    if (error) {
        console.error('Error tracking view:', error)
        // Fail silently to not impact user experience
    }
}

export async function submitLead(templateId: string, formData: FormData) {
    const supabase = await createClient()

    // 🔒 SECURITY: Rate limiting to prevent spam
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const identifier = `lead:${templateId}:${ip}`

    const rateLimitResult = await rateLimit(
        identifier,
        RATE_LIMITS.LEAD_SUBMISSION.limit,
        RATE_LIMITS.LEAD_SUBMISSION.window
    )

    if (!rateLimitResult.success) {
        return actionError('Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.')
    }

    // Extraer datos del FormData
    const rawData = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string | null,
    }

    // 🔒 SECURITY: Validar con Zod antes de procesar
    const validationResult = leadCaptureSchema.safeParse(rawData)

    if (!validationResult.success) {
        return actionError('Datos inválidos', validationResult.error.flatten().fieldErrors)
    }

    // Usar datos validados
    const { name, phone, email } = validationResult.data

    const { error } = await supabase
        .from('template_leads')
        .insert({
            template_id: templateId,
            name,
            phone,
            email: email || null,
        })

    if (error) {
        console.error('Error submitting lead:', error)
        return actionError('Error al guardar la información')
    }

    return actionSuccess(undefined)
}

// --- Actions for Dashboard (Analytics) ---

export const getTemplateAnalytics = createOrgAction(
    async ({ supabase, orgId }, templateId: string) => {
        const { data: template } = await supabase
            .from('procedure_templates')
            .select('organization_id')
            .eq('id', templateId)
            .eq('organization_id', orgId)
            .single()

        if (!template) {
            return actionError('Plantilla no encontrada')
        }

        // 1. Get Totals
        const { count: viewsCount } = await supabase
            .from('template_views')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', templateId)

        const { count: leadsCount } = await supabase
            .from('template_leads')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', templateId)

        // 2. Get Recent Leads
        const { data: recentLeads } = await supabase
            .from('template_leads')
            .select('*')
            .eq('template_id', templateId)
            .order('created_at', { ascending: false })
            .limit(10)

        // 3. Get Chart Data (Last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: viewsData } = await supabase
            .from('template_views')
            .select('created_at')
            .eq('template_id', templateId)
            .gte('created_at', thirtyDaysAgo.toISOString())

        const { data: leadsData } = await supabase
            .from('template_leads')
            .select('created_at')
            .eq('template_id', templateId)
            .gte('created_at', thirtyDaysAgo.toISOString())

        // Aggregate by day
        const chartMap = new Map<string, { date: string; views: number; leads: number }>()

        // Fill last 30 days with 0
        for (let i = 0; i < 30; i++) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            chartMap.set(dateStr, { date: dateStr, views: 0, leads: 0 })
        }

        viewsData?.forEach((v) => {
            const dateStr = v.created_at.split('T')[0]
            if (chartMap.has(dateStr)) {
                chartMap.get(dateStr)!.views += 1
            }
        })

        leadsData?.forEach((l) => {
            const dateStr = l.created_at.split('T')[0]
            if (chartMap.has(dateStr)) {
                chartMap.get(dateStr)!.leads += 1
            }
        })

        const chartData = Array.from(chartMap.values()).sort((a, b) => a.date.localeCompare(b.date))

        // 4. Get Clones (Top 10)
        const { data: clonesData } = await supabase
            .from('procedure_templates')
            .select(`
                id,
                created_at,
                source_ip_country,
                organization:organizations(name)
            `)
            .eq('source_template_id', templateId)
            .order('created_at', { ascending: false })
            .limit(10)

        const clones = clonesData?.map((c) => {
            const org = Array.isArray(c.organization) ? c.organization[0] : c.organization
            return {
                id: c.id,
                organization_name: org?.name || 'Organización desconocida',
                country: c.source_ip_country,
                created_at: c.created_at
            }
        }) || []

        return actionSuccess({
            totalViews: viewsCount || 0,
            totalLeads: leadsCount || 0,
            conversionRate: viewsCount ? ((leadsCount || 0) / viewsCount) * 100 : 0,
            recentLeads: recentLeads || [],
            clones,
            chartData,
        })
    }
)

export const getTemplateClones = createOrgAction(
    async ({ supabase }, templateId: string, page: number = 1, limit: number = 20) => {
        // Offset
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, count, error } = await supabase
            .from('procedure_templates')
            .select(`
                id,
                created_at,
                source_ip_country,
                organization:organizations(name)
            `, { count: 'exact' })
            .eq('source_template_id', templateId)
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) {
            return actionError(error.message)
        }

        const clones = data?.map((c) => {
            const org = Array.isArray(c.organization) ? c.organization[0] : c.organization
            return {
                id: c.id,
                organization_name: org?.name || 'Organización desconocida',
                country: c.source_ip_country,
                created_at: c.created_at
            }
        }) || []

        return actionSuccess({
            clones,
            count: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        })
    }
)
