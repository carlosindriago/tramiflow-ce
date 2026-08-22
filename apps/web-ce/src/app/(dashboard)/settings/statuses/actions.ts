'use server'

import { revalidatePath } from 'next/cache'
import { CreateProcedureStatusInput, UpdateProcedureStatusInput, actionSuccess, actionError } from '@carlosindriago/core'
import { createOrgAction } from '@/lib/action-helpers'
import { createClient } from '@carlosindriago/database/server'

export async function createProcedureStatusAction(input: CreateProcedureStatusInput) {
    return createOrgAction(
        async ({ supabase, orgId }, dataInput: CreateProcedureStatusInput) => {
            const { data, error } = await supabase
                .from('procedure_statuses')
                .insert({
                    organization_id: orgId,
                    name: dataInput.name,
                    color: dataInput.color,
                    is_final: dataInput.is_final,
                    order_index: dataInput.order_index
                })
                .select()
                .maybeSingle()

            if (error) return actionError(error.message)

            try {
                revalidatePath('/settings/statuses')
                revalidatePath('/procedures')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess(data)
        }
    )(input)
}

export async function updateProcedureStatusConfigAction(input: UpdateProcedureStatusInput) {
    return createOrgAction(
        async ({ supabase, orgId }, dataInput: UpdateProcedureStatusInput) => {
            const updateData: {
                name?: string
                color?: string
                is_final?: boolean
                order_index?: number
                updated_at: string
            } = {
                updated_at: new Date().toISOString()
            }

            if (dataInput.name !== undefined) updateData.name = dataInput.name
            if (dataInput.color !== undefined) updateData.color = dataInput.color
            if (dataInput.is_final !== undefined) updateData.is_final = dataInput.is_final
            if (dataInput.order_index !== undefined) updateData.order_index = dataInput.order_index

            const { error } = await supabase
                .from('procedure_statuses')
                .update(updateData)
                .eq('id', dataInput.id)
                .eq('organization_id', orgId)

            if (error) return actionError(error.message)

            try {
                revalidatePath('/settings/statuses')
                revalidatePath('/procedures')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess(undefined)
        }
    )(input)
}

export async function deleteProcedureStatusAction(id: string) {
    return createOrgAction(
        async ({ supabase, orgId }, statusId: string) => {
            const { error } = await supabase
                .from('procedure_statuses')
                .delete()
                .eq('id', statusId)
                .eq('organization_id', orgId)

            if (error) return actionError(error.message)

            try {
                revalidatePath('/settings/statuses')
                revalidatePath('/procedures')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess(undefined)
        }
    )(id)
}

export async function reorderProcedureStatusesAction(items: { id: string, order_index: number }[]) {
    return createOrgAction(
        async ({ supabase, orgId }, orderItems: { id: string, order_index: number }[]) => {
            const updates = orderItems.map(item =>
                supabase
                    .from('procedure_statuses')
                    .update({ order_index: item.order_index })
                    .eq('id', item.id)
                    .eq('organization_id', orgId)
            )

            await Promise.all(updates)

            try {
                revalidatePath('/settings/statuses')
                revalidatePath('/procedures')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess(undefined)
        }
    )(items)
}

export async function seedDefaultProcedureStatuses(organizationId: string) {
    const supabase = await createClient()

    // Check if statuses already exist for this org to prevent double seeding
    const { count } = await supabase
        .from('procedure_statuses')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

    if (count && count > 0) {
        return
    }

    const defaultStatuses = [
        { name: 'Documentación Pendiente', color: 'amber', is_final: false, order_index: 0 },
        { name: 'En Trámite', color: 'blue', is_final: false, order_index: 1 },
        { name: 'En Subsanación', color: 'rose', is_final: false, order_index: 2 },
        { name: 'Finalizado', color: 'emerald', is_final: true, order_index: 3 }
    ]

    const inserts = defaultStatuses.map(status => ({
        ...status,
        organization_id: organizationId
    }))

    const { error } = await supabase
        .from('procedure_statuses')
        .insert(inserts)

    if (error) {
        console.error('Error seeding default statuses:', error)
    }
}
