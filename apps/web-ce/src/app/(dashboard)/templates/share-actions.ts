'use server'

import { createClient } from '@carlosindriago/database/server'
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
    const parsed = shareSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: 'Datos de configuración inválidos' }
    }
    const data = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Generate token if public and doesn't exist
    let share_token = undefined
    if (data.visibility === 'public') {
        const { data: current } = await supabase
            .from('procedure_templates')
            .select('share_token')
            .eq('id', data.templateId)
            .single()

        if (!current?.share_token) {
            share_token = crypto.randomUUID()
        }
    }

    const { error } = await supabase
        .from('procedure_templates')
        .update({
            visibility: data.visibility,
            is_publicly_visible: data.visibility === 'public',
            ...(share_token ? { share_token } : {}),
            ...(data.public_settings ? { public_settings: data.public_settings } : {})
        })
        .eq('id', data.templateId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/templates/${data.templateId}`)
    return { success: true }
}

export async function inviteUserAction(input: z.infer<typeof permissionSchema>) {
    const parsed = permissionSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: 'Email o ID de plantilla inválidos' }
    }
    const data = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
        .from('template_permissions')
        .insert({
            template_id: data.templateId,
            email: data.email,
        })

    if (error) {
        if (error.code === '23505') return { success: false, error: 'Usuario ya invitado' }
        return { success: false, error: error.message }
    }

    revalidatePath(`/templates/${data.templateId}`)
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
