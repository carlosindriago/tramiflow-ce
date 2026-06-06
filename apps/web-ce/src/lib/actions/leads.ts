// @ts-nocheck
'use server'

import { createClient } from '@tramiflow/database/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { RATE_LIMITS } from '@tramiflow/core'
import { rateLimit } from '@tramiflow/core/server'

const LeadSchema = z.object({
    organization_id: z.string().uuid(),
    name: z.string().min(2, { message: 'El nombre es muy corto' }).max(100, { message: 'El nombre es demasiado largo' }),
    phone: z.string().min(8, { message: 'El teléfono debe tener al menos 8 caracteres' }).max(30, { message: 'El teléfono es demasiado largo' }),
    service_interest: z.string().max(200, { message: 'El interés de servicio es demasiado largo' }).optional(),
})

export type CreateLeadState = {
    success?: boolean
    error?: string
    fieldErrors?: {
        name?: string[]
        phone?: string[]
    }
}
export async function createLead(prevState: CreateLeadState | undefined, formData: FormData): Promise<CreateLeadState> {
    // 1. Honeypot Security Check
    // If the hidden field 'website_trap' has any value, it's a bot.
    // We return "success" to confuse the bot, but do nothing.
    const honeypot = formData.get('website_trap')
    if (honeypot) {
        console.warn('Bot detected via honeypot')
        return { success: true }
    }

    const supabase = await createClient()

    // Validate fields
    const validatedFields = LeadSchema.safeParse({
        organization_id: formData.get('organization_id'),
        name: formData.get('name'),
        phone: formData.get('phone'),
        service_interest: formData.get('service_interest'),
    })

    if (!validatedFields.success) {
        return {
            error: 'Campos inválidos',
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { organization_id, name, phone, service_interest } = validatedFields.data

    // 2. Rate Limiting (IP + organization)
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'

    const rateLimitResult = await rateLimit(
        `lead:${organization_id}:${clientIp}`,
        RATE_LIMITS.LEAD_SUBMISSION.limit,
        RATE_LIMITS.LEAD_SUBMISSION.window
    )

    if (!rateLimitResult.success) {
        return { error: 'Has alcanzado el límite de solicitudes. Intenta nuevamente en un momento.' }
    }

    try {
        const { error } = await supabase.from('leads').insert({
            organization_id,
            name,
            phone,
            service_interest,
            status: 'new',
        })

        if (error) {
            console.error('Lead Error:', error)
            return { error: 'Error al guardar el contacto. Intenta de nuevo.' }
        }

        return { success: true }
    } catch (error) {
        console.error('Server Error:', error)
        return { error: 'Error interno del servidor' }
    }
}

export async function getLeads() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get Org
    const { data: member } = await supabase.from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!member) return []

    const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false })

    return leads || []
}
