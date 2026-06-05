'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const PublicSettingsSchema = z.object({
    organization_id: z.string().uuid(),
    settings: z.object({
        theme: z.enum(['modern_light', 'dark_elegance', 'navy_pro']).default('modern_light'),
        headline: z.string().optional(),
        subheadline: z.string().optional(),
        primary_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional(),
        cta_text: z.string().default('Consultar Gratis'),
        show_prices: z.boolean().default(true),
    })
})

export type SettingsState = {
    success?: boolean
    error?: string
}

export async function updatePublicSettings(prevState: SettingsState, formData: FormData): Promise<SettingsState> {
    const supabase = await createClient()

    const rawSettings = {
        theme: formData.get('theme'),
        headline: formData.get('headline'),
        subheadline: formData.get('subheadline'),
        primary_color: formData.get('primary_color'),
        cta_text: formData.get('cta_text'),
        show_prices: formData.get('show_prices') === 'on',
    }

    const validatedFields = PublicSettingsSchema.safeParse({
        organization_id: formData.get('organization_id'),
        settings: rawSettings,
    })

    if (!validatedFields.success) {
        return { error: 'Datos inválidos. Revisa los campos.' }
    }

    const { organization_id, settings } = validatedFields.data

    try {
        // Authenticate user is owner/admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'No autenticado' }

        const { data: member } = await supabase.from('organization_members')
            .select('role')
            .eq('organization_id', organization_id)
            .eq('user_id', user.id)
            .single()

        if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
            return { error: 'No tienes permisos para editar esta organización' }
        }

        const { error } = await supabase.from('organizations')
            .update({ public_settings: settings })
            .eq('id', organization_id)

        if (error) throw error

        revalidatePath('/settings/profile')
        revalidatePath(`/u/${organization_id}`) // Revalidate by ID just in case

        // We also try to revalidate by slug if possible, but we don't have slug here.
        // Usually Next.js revalidateTag is better for this, but path based is fine.

        return { success: true }
    } catch (error) {
        console.error('Update Settings Error:', error)
        return { error: 'Error al actualizar la configuración.' }
    }
}
