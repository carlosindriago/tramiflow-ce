// @ts-nocheck
'use server'

import { createClient } from '@tramiflow/database/server'
import { headers } from 'next/headers'
import { leadCaptureSchema } from '@tramiflow/core'
import { userAgent } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@tramiflow/core'

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
        return {
            success: false,
            error: 'Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.',
        }
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
        // Zod 4: usar .issues directamente y agrupar por campo
        const fieldErrors: Record<string, string[]> = {}

        for (const issue of validationResult.error.issues) {
            const field = issue.path[0]?.toString() || 'form'
            if (!fieldErrors[field]) {
                fieldErrors[field] = []
            }
            fieldErrors[field].push(issue.message)
        }

        const firstError = validationResult.error.issues[0]?.message || 'Datos inválidos'

        return {
            success: false,
            error: firstError,
            fieldErrors,
        }
    }

    // Usar datos validados
    const { name, phone, email } = validationResult.data

    const { error } = await supabase
        .from('template_leads')
        .insert({
            template_id: templateId,
            name,
            phone,
            email: email || null, // Asegurar null si email es undefined
        })

    if (error) {
        console.error('Error submitting lead:', error)
        return { success: false, error: 'Error al guardar la información' }
    }

    return { success: true }
}

// --- Actions for Dashboard (Analytics) ---

export async function getTemplateAnalytics(templateId: string) {
    const supabase = await createClient()

    // 🔒 SECURITY: Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    // 🔒 SECURITY: Check ownership - user can only view analytics from their org
    const { data: members } = await supabase.from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

    const organizationId = members?.[0]?.organization_id

    if (!organizationId) {
        return { success: false, error: 'Organization not found' }
    }

    const { data: template } = await supabase
        .from('procedure_templates')
        .select('organization_id')
        .eq('id', templateId)
        .single()

    if (!template || template.organization_id !== organizationId) {
        return { success: false, error: 'Forbidden' }
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

    // 3. Get Chart Data (Last 30 days) - simplified for MVP
    // For a real app, I'd write a proper SQL function for date wrapping, 
    // but here I'll fetch raw data and aggregate in JS for now (assuming low volume for MVP)
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

    return {
        success: true,
        data: {
            totalViews: viewsCount || 0,
            totalLeads: leadsCount || 0,
            conversionRate: viewsCount ? ((leadsCount || 0) / viewsCount) * 100 : 0,
            recentLeads: recentLeads || [],
            clones,
            chartData,
        }
    }
}

export async function getTemplateClones(templateId: string, page: number = 1, limit: number = 20) {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

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
        return { success: false, error: error.message }
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

    return { success: true, data: clones, count, page, totalPages: Math.ceil((count || 0) / limit) }
}
