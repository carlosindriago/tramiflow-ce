'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Schema for validation
const websiteSettingsSchema = z.object({
    theme: z.enum(['modern_light', 'dark_elegance', 'navy_pro']).optional(),
    layout: z.enum(['hero_focused', 'professional_list', 'simple_bio']).optional(),
    headline: z.string().max(100).optional(),
    subheadline: z.string().max(200).optional(),
    primary_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    cta_text: z.string().max(30).optional(),
    show_prices: z.boolean().optional(),
    show_reviews: z.boolean().optional(),
    badges: z.array(z.string()).optional(),
    social_urls: z.object({
        instagram: z.string().url().optional().or(z.literal('')),
        linkedin: z.string().url().optional().or(z.literal('')),
        tiktok: z.string().url().optional().or(z.literal('')),
    }).optional()
})

export type WebsiteSettings = z.infer<typeof websiteSettingsSchema>

export async function getWebsiteSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Get user's organization
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!member) {
        throw new Error('No organization found')
    }


    const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, public_settings')
        .eq('id', member.organization_id)
        .single()

    return {
        settings: org?.public_settings as WebsiteSettings | null,
        slug: org?.slug,
        name: org?.name,
        id: org?.id
    }
}

export async function updateWebsiteSettings(settings: WebsiteSettings) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const parsed = websiteSettingsSchema.safeParse(settings)
    if (!parsed.success) {
        return { error: 'Invalid settings' }
    }

    // Get user's organization
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!member) {
        return { error: 'No organization found' }
    }


    // Update settings using JSONB merge
    const { data: updated, error } = await supabase
        .from('organizations')
        .update({
            public_settings: parsed.data
        })
        .eq('id', member.organization_id)
        .select()

    if (error) {
        return { error: error.message }
    }

    if (!updated || updated.length === 0) {
        return { error: 'No se pudieron guardar los cambios. Verifique permisos o llame a soporte.' }
    }

    // Get slug for revalidation
    const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', member.organization_id)
        .single()

    revalidatePath('/website')
    if (org?.slug) {
        revalidatePath(`/u/${org.slug}`, 'layout') // Revalidate layout to be safe
        revalidatePath(`/u/${org.slug}`, 'page')
    }

    return { success: true }
}
