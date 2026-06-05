'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@tramiflow/database/server'
import { z } from 'zod'
import type { Category } from '@tramiflow/core'

// Schema para validar categorías
const categorySchema = z.object({
    id: z.uuid().optional(),
    name: z.string().min(1, 'El nombre es requerido'),
    slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'El slug debe contener solo letras minúsculas, números y guiones'),
    description: z.string().optional(),
    color: z.enum(['default', 'blue', 'green', 'amber', 'red', 'purple']).default('default'),
    icon: z.string().optional(),
})

export type CategoryInput = z.infer<typeof categorySchema>

// Obtener todas las categorías de la organización
export async function getCategories(): Promise<{ success: boolean; data?: Category[]; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // Obtener organization_id del usuario
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (!member?.organization_id) {
            return { success: false, error: 'No se encontró organización' }
        }

        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .eq('organization_id', member.organization_id)
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching categories:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data: categories || [] }
    } catch (error) {
        console.error('Error fetching categories:', error)
        return { success: false, error: 'Error al cargar categorías' }
    }
}

// Crear categoría
export async function createCategory(input: CategoryInput): Promise<{ success: boolean; data?: Category; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // Validar input
        const validatedData = categorySchema.parse(input)

        // Obtener organization_id del usuario
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (!member?.organization_id) {
            return { success: false, error: 'No se encontró organización' }
        }

        // Crear categoría
        const { data, error } = await supabase
            .from('categories')
            .insert({
                organization_id: member.organization_id,
                name: validatedData.name,
                slug: validatedData.slug,
                description: validatedData.description,
                color: validatedData.color,
                icon: validatedData.icon,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating category:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/templates/new')
        revalidatePath('/settings/categories')

        return { success: true, data }
    } catch (error) {
        console.error('Error creating category:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return { success: false, error: 'Error al crear categoría' }
    }
}

// Actualizar categoría
export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<{ success: boolean; data?: Category; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // Validar input (partial for updates)
        const validatedData = categorySchema.partial().parse(input)

        // Verificar que la categoría pertenezca a la organización del usuario
        const { data: existing } = await supabase
            .from('categories')
            .select('organization_id, slug')
            .eq('id', id)
            .single()

        if (!existing) {
            return { success: false, error: 'Categoría no encontrada' }
        }

        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (!member?.organization_id || member.organization_id !== existing.organization_id) {
            return { success: false, error: 'No tienes permiso para editar esta categoría' }
        }

        // Actualizar categoría
        const { data, error } = await supabase
            .from('categories')
            .update({
                name: validatedData.name,
                slug: validatedData.slug,
                description: validatedData.description,
                color: validatedData.color,
                icon: validatedData.icon,
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating category:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/templates/new')
        revalidatePath('/settings/categories')

        return { success: true, data }
    } catch (error) {
        console.error('Error updating category:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        return { success: false, error: 'Error al actualizar categoría' }
    }
}

// Eliminar categoría
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'No autenticado' }
        }

        // Verificar permisos
        const { data: category } = await supabase
            .from('categories')
            .select('organization_id')
            .eq('id', id)
            .single()

        if (!category) {
            return { success: false, error: 'Categoría no encontrada' }
        }

        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (!member?.organization_id || member.organization_id !== category.organization_id) {
            return { success: false, error: 'No tienes permiso para eliminar esta categoría' }
        }

        // Verificar que no hay templates usando esta categoría
        const { data: templates } = await supabase
            .from('procedure_templates')
            .select('id')
            .eq('category', (category as Record<string, unknown>).slug as string)
            .limit(1)

        if (templates && templates.length > 0) {
            return { success: false, error: 'No se puede eliminar: hay templates usando esta categoría' }
        }

        // Eliminar categoría
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting category:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/templates/new')
        revalidatePath('/settings/categories')

        return { success: true }
    } catch (error) {
        console.error('Error deleting category:', error)
        return { success: false, error: 'Error al eliminar categoría' }
    }
}
