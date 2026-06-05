// @ts-nocheck
'use server'

import { createClient } from '@tramiflow/database/server'
import { revalidatePath } from 'next/cache'
import { CreateProcedureStatusInput, UpdateProcedureStatusInput } from '@tramiflow/core'

export async function createProcedureStatusAction(input: CreateProcedureStatusInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Get organization
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return { success: false, error: 'No organization' }

    const { data, error } = await supabase
        .from('procedure_statuses')
        .insert({
            organization_id: member.organization_id,
            name: input.name,
            color: input.color,
            is_final: input.is_final,
            order_index: input.order_index
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/settings/statuses')
    revalidatePath('/procedures')
    return { success: true, data }
}

export async function updateProcedureStatusConfigAction(input: UpdateProcedureStatusInput) {
    const supabase = await createClient()

/* eslint-disable */
    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.color !== undefined) updateData.color = input.color
    if (input.is_final !== undefined) updateData.is_final = input.is_final
    if (input.order_index !== undefined) updateData.order_index = input.order_index
    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase
        .from('procedure_statuses')
        .update(updateData)
        .eq('id', input.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/settings/statuses')
    revalidatePath('/procedures')
    return { success: true }
}

export async function deleteProcedureStatusAction(id: string) {
    const supabase = await createClient()

    // Check if used? The database has ON DELETE SET NULL on procedures.status_id
    // But we might want to warn user or prevent if procedures exist.
    // For now, let's allow delete.

    const { error } = await supabase
        .from('procedure_statuses')
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/settings/statuses')
    revalidatePath('/procedures')
    return { success: true }
}

export async function reorderProcedureStatusesAction(items: { id: string, order_index: number }[]) {
    const supabase = await createClient()

    // This could be optimized safely with a transaction or batch update if Supabase supported it well
    // Using Promise.all for now
    const updates = items.map(item =>
        supabase
            .from('procedure_statuses')
            .update({ order_index: item.order_index })
            .eq('id', item.id)
    )

    await Promise.all(updates)
 
     revalidatePath('/settings/statuses')
     revalidatePath('/procedures')
     return { success: true }
 }
 
 export async function seedDefaultProcedureStatuses(organizationId: string) {
     const supabase = await createClient()
 
     // Check if statuses already exist for this org to prevent double seeding
     const { count } = await supabase
         .from('procedure_statuses')
         .select('*', { count: 'exact', head: true })
         .eq('organization_id', organizationId)
 
     if (count && count > 0) {
         return { success: true, message: 'Ya existen estados' }
     }
 
     const defaultStatuses = [
         { name: 'Pendiente', color: '#64748b', order_index: 1, is_final: false },
         { name: 'Pago de Trámite', color: '#3b82f6', order_index: 2, is_final: false },
         { name: 'Realizando Trámite', color: '#6366f1', order_index: 3, is_final: false },
         { name: 'Espera Aprobación', color: '#f97316', order_index: 4, is_final: false },
         { name: 'Aprobado', color: '#22c55e', order_index: 5, is_final: true },
         { name: 'Rechazado', color: '#ef4444', order_index: 6, is_final: true },
     ]
 
     const dataToInsert = defaultStatuses.map(status => ({
         organization_id: organizationId,
         ...status
     }))
 
     const { error } = await supabase
         .from('procedure_statuses')
         .insert(dataToInsert)
 
     if (error) {
         console.error('Error seeding default statuses:', error)
         return { success: false, error: error.message }
     }
 
     return { success: true }
 }
