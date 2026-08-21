'use server'

import { revalidatePath } from 'next/cache'
import { CreateProcedureStatusInput, UpdateProcedureStatusInput, actionSuccess, actionError } from '@carlosindriago/core'
import { createOrgAction } from '@/lib/action-helpers'
import { createClient } from '@carlosindriago/database/server'

export const createProcedureStatusAction = createOrgAction(
    async ({ supabase, orgId }, input: CreateProcedureStatusInput) => {
        const { data, error } = await supabase
            .from('procedure_statuses')
            .insert({
                organization_id: orgId,
                name: input.name,
                color: input.color,
                is_final: input.is_final,
                order_index: input.order_index
            })
            .select()
            .single()

        if (error) return actionError(error.message)

        revalidatePath('/settings/statuses')
        revalidatePath('/procedures')
        return actionSuccess(data)
    }
)

export const updateProcedureStatusConfigAction = createOrgAction(
    async ({ supabase, orgId }, input: UpdateProcedureStatusInput) => {
        const updateData: {
            name?: string
            color?: string
            is_final?: boolean
            order_index?: number
            updated_at: string
        } = {
            updated_at: new Date().toISOString()
        }

        if (input.name !== undefined) updateData.name = input.name
        if (input.color !== undefined) updateData.color = input.color
        if (input.is_final !== undefined) updateData.is_final = input.is_final
        if (input.order_index !== undefined) updateData.order_index = input.order_index

        const { error } = await supabase
            .from('procedure_statuses')
            .update(updateData)
            .eq('id', input.id)
            .eq('organization_id', orgId)

        if (error) return actionError(error.message)

        revalidatePath('/settings/statuses')
        revalidatePath('/procedures')
        return actionSuccess(undefined)
    }
)

export const deleteProcedureStatusAction = createOrgAction(
    async ({ supabase, orgId }, id: string) => {
        const { error } = await supabase
            .from('procedure_statuses')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)

        if (error) return actionError(error.message)

        revalidatePath('/settings/statuses')
        revalidatePath('/procedures')
        return actionSuccess(undefined)
    }
)

export const reorderProcedureStatusesAction = createOrgAction(
    async ({ supabase, orgId }, items: { id: string, order_index: number }[]) => {
        const updates = items.map(item =>
            supabase
                .from('procedure_statuses')
                .update({ order_index: item.order_index })
                .eq('id', item.id)
                .eq('organization_id', orgId)
        )

        await Promise.all(updates)

        revalidatePath('/settings/statuses')
        revalidatePath('/procedures')
        return actionSuccess(undefined)
    }
)

export async function seedDefaultProcedureStatuses(organizationId: string) {
    const supabase = await createClient()

    // Check if statuses already exist for this org to prevent double seeding
    const { count } = await supabase
        .from('procedure_statuses')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

    if (count && count > 0) {
        return actionSuccess({ message: 'Ya existen estados' })
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
        return actionError(error.message)
    }

    return actionSuccess(undefined)
}
