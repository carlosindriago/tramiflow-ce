'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const shareSchema = z.object({
    templateId: z.string(),
    visibility: z.enum(['private', 'public', 'restricted']),
    public_settings: z.object({
        allow_copy: z.boolean(),
        show_fees: z.boolean(),
        show_requirements: z.boolean(),
        show_steps: z.boolean().optional(),
    }).optional(),
})

const permissionSchema = z.object({
    templateId: z.string(),
    email: z.string().email(),
})

export async function updateTemplateVisibilityAction(input: z.infer<typeof shareSchema>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Generate token if public and doesn't exist
    let share_token = undefined
    if (input.visibility === 'public') {
        const { data: current } = await supabase
            .from('procedure_templates')
            .select('share_token')
            .eq('id', input.templateId)
            .single()

        if (!current?.share_token) {
            share_token = crypto.randomUUID()
        }
    }

    const { error } = await supabase
        .from('procedure_templates')
        .update({
            visibility: input.visibility,
            is_publicly_visible: input.visibility === 'public',
            ...(share_token ? { share_token } : {}),
            ...(input.public_settings ? { public_settings: input.public_settings } : {})
        })
        .eq('id', input.templateId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/templates/${input.templateId}`)
    return { success: true }
}

export async function inviteUserAction(input: z.infer<typeof permissionSchema>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
        .from('template_permissions')
        .insert({
            template_id: input.templateId,
            email: input.email,
        })

    if (error) {
        if (error.code === '23505') return { success: false, error: 'Usuario ya invitado' }
        return { success: false, error: error.message }
    }

    revalidatePath(`/templates/${input.templateId}`)
    return { success: true }
}

export async function removeUserPermissionAction(permissionId: string, templateId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
        .from('template_permissions')
        .delete()
        .eq('id', permissionId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/templates/${templateId}`)
    return { success: true }
}

export async function getTemplatePermissionsAction(templateId: string) {
    const supabase = await createClient()

    // Check auth implicitly via RLS
    const { data, error } = await supabase
        .from('template_permissions')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data }
}
