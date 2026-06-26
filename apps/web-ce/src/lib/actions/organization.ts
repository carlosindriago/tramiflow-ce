'use server'

import { createClient } from '@carlosindriago/database/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const OrganizationSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
    whatsapp: z.string().optional().or(z.literal('')),
    logo_url: z.string().optional().or(z.literal('')),
})

export async function updateOrganization(prevState: { message?: string, errors?: Record<string, string[]> } | null | undefined, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { message: 'No autenticado', errors: {} }
    }

    const organizationId = formData.get('id') as string

    if (!organizationId) {
        return { message: 'ID de organización faltante', errors: {} }
    }

    // Verify permissions
    const { data: member } = await supabase.from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
        return { message: 'No tienes permisos para editar esta organización', errors: {} }
    }

    const rawData = {
        name: formData.get('name'),
        slug: formData.get('slug'),
        whatsapp: formData.get('whatsapp'),
        logo_url: formData.get('logo_url')
    }

    const parsed = OrganizationSchema.safeParse(rawData)

    if (!parsed.success) {
        return {
            message: 'Error de validación',
            errors: parsed.error.flatten().fieldErrors
        }
    }

    // Check unique slug (if changed)
    // We can relies on DB constraint, but better UX to check first or handle DB error.
    // DB Constraint `organizations_slug_key` will throw error.

    const { error } = await supabase.from('organizations')
        .update(parsed.data)
        .eq('id', organizationId)

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { message: 'El slug ya está en uso', errors: { slug: ['Este slug ya existe'] } }
        }
        return { message: 'Error al actualizar: ' + error.message, errors: {} }
    }

    revalidatePath('/settings')
    revalidatePath('/(dashboard)', 'layout')

    return { success: true, message: 'Organización actualizada correctamente', errors: {} }
}
