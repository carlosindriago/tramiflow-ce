'use server'

import { revalidatePath } from 'next/cache'
import { ProcedureChecklistProgress, actionSuccess, actionError } from '@carlosindriago/core'
import { createOrgAction } from '@/lib/action-helpers'

export async function getProcedureStatusesAction() {
    return createOrgAction(async ({ supabase, orgId }) => {
        const { data, error } = await supabase
            .from('procedure_statuses')
            .select('*')
            .eq('organization_id', orgId)
            .order('order_index', { ascending: true })

        if (error) {
            console.error('Error fetching statuses:', error)
            return actionError(error.message)
        }

        return actionSuccess(data || [])
    })()
}

export async function getProceduresAction(includeArchived: boolean = false) {
    return createOrgAction(
        async ({ supabase, orgId }, archived: boolean = false) => {
            const query = supabase
                .from('procedures')
                .select(`
                    *,
                    client:clients(id, full_name, email),
                    template:procedure_templates(
                        id,
                        name,
                        requirements,
                        steps,
                        fees_professional:fees,
                        fees_official:government_fee
                    ),
                    status_details:procedure_statuses(*)
                `, { count: 'exact' })
                .eq('organization_id', orgId)
                .order('created_at', { ascending: false })

            const { data, error } = await query

            if (error) {
                console.error('Error fetching procedures:', error)
                return actionError(error.message)
            }

            let procedures = (data || []).map(p => ({
                ...p,
                status: p.status_id,
            }))

            if (!archived) {
                procedures = procedures.filter(p => !p.status_details?.is_final)
            } else {
                procedures = procedures.filter(p => p.status_details?.is_final)
            }

            return actionSuccess(procedures)
        }
    )(includeArchived)
}

export async function getProcedureByIdAction(id: string) {
    return createOrgAction(
        async ({ supabase, orgId }, procId: string) => {
            const { data, error } = await supabase
                .from('procedures')
                .select(`
                    *,
                    client:clients(id, full_name, email, phone, identifications),
                    template:procedure_templates(
                        id,
                        name,
                        requirements,
                        steps,
                        fees_professional:fees,
                        fees_official:government_fee
                    ),
                    status_details:procedure_statuses(*)
                `)
                .eq('id', procId)
                .eq('organization_id', orgId)
                .maybeSingle()

            if (error || !data) {
                console.error('Error fetching procedure:', error)
                return actionError(error?.message || 'Trámite no encontrado')
            }

            const procedure = {
                ...data,
                status: data.status_id,
            }

            return actionSuccess(procedure)
        }
    )(id)
}

export async function createProcedureAction(input: { clientId: string; templateId: string }) {
    return createOrgAction(
        async ({ supabase, orgId }, dataInput: { clientId: string; templateId: string }) => {
            // Check Plan Limits
            const { checkLimit } = await import('@carlosindriago/database/limits')
            const limitStatus = await checkLimit(orgId, 'procedures', supabase)

            if (limitStatus.status === 'unverified_blocked') {
                return actionError('UNVERIFIED_BLOCKED')
            }

            if (limitStatus.status === 'blocked') {
                return actionError('LIMIT_REACHED')
            }

            // 1. Fetch Template to copy details
            const { data: template, error: templateError } = await supabase
                .from('procedure_templates')
                .select('*')
                .eq('id', dataInput.templateId)
                .maybeSingle()

            if (templateError || !template) {
                return actionError('Plantilla no encontrada')
            }

            // 2. Fetch Initial Status (Order 1)
            let { data: initialStatus } = await supabase
                .from('procedure_statuses')
                .select('id')
                .eq('organization_id', orgId)
                .order('order_index', { ascending: true })
                .limit(1)
                .maybeSingle()

            if (!initialStatus) {
                const { seedDefaultProcedureStatuses } = await import('@/app/(dashboard)/settings/statuses/actions')
                await seedDefaultProcedureStatuses(orgId)

                const refetch = await supabase
                    .from('procedure_statuses')
                    .select('id')
                    .eq('organization_id', orgId)
                    .order('order_index', { ascending: true })
                    .limit(1)
                    .maybeSingle()

                initialStatus = refetch.data
                if (!initialStatus) {
                    return actionError('No se encontraron estados configurados para la organización')
                }
            }

            // 3. Initialize checklist progress (all false)
            const initialChecklist: ProcedureChecklistProgress = {}
            const reqs = Array.isArray(template.requirements) ? template.requirements : []

            reqs.forEach((req: unknown) => {
                if (typeof req === 'object' && req !== null && 'id' in req && typeof req.id === 'string') {
                    initialChecklist[req.id] = false
                }
            })

            // 4. Create Procedure
            const { data: newProcedure, error: createError } = await supabase
                .from('procedures')
                .insert({
                    organization_id: orgId,
                    client_id: dataInput.clientId,
                    template_id: dataInput.templateId,
                    title: template.name,
                    status: 'pending_docs',
                    status_id: initialStatus.id,
                    checklist_progress: initialChecklist,
                    current_step_index: 0,
                    payment_status: 'pending',
                    requirements_snapshot: reqs
                })
                .select()
                .maybeSingle()

            if (createError || !newProcedure) {
                return actionError(createError?.message || 'Error al crear el trámite')
            }

            try {
                revalidatePath('/procedures')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess({ ...newProcedure, status: newProcedure.status_id })
        }
    )(input)
}

export async function updateProcedureStatusAction(id: string, statusId: string) {
    return createOrgAction(
        async ({ supabase, orgId }, procId: string, stId: string) => {
            const { error } = await supabase
                .from('procedures')
                .update({ status_id: stId })
                .eq('id', procId)
                .eq('organization_id', orgId)

            if (error) {
                return actionError(error.message)
            }

            try {
                revalidatePath('/procedures')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess(undefined)
        }
    )(id, statusId)
}

export async function updateProcedureChecklistAction(id: string, checklist: ProcedureChecklistProgress) {
    return createOrgAction(
        async ({ supabase, orgId }, procId: string, chk: ProcedureChecklistProgress) => {
            const { error } = await supabase
                .from('procedures')
                .update({ checklist_progress: chk })
                .eq('id', procId)
                .eq('organization_id', orgId)

            if (error) {
                return actionError(error.message)
            }

            try {
                revalidatePath('/procedures')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess(undefined)
        }
    )(id, checklist)
}

export async function updateProcedurePaymentStatusAction(id: string, status: 'pending' | 'partial' | 'paid') {
    return createOrgAction(
        async ({ supabase, orgId }, procId: string, st: 'pending' | 'partial' | 'paid') => {
            const { error } = await supabase
                .from('procedures')
                .update({ payment_status: st })
                .eq('id', procId)
                .eq('organization_id', orgId)

            if (error) {
                return actionError(error.message)
            }

            try {
                revalidatePath('/procedures')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess(undefined)
        }
    )(id, status)
}

export async function updateProcedureStepAction(id: string, stepIndex: number) {
    return createOrgAction(
        async ({ supabase, orgId }, procId: string, sIdx: number) => {
            const { error } = await supabase
                .from('procedures')
                .update({ current_step_index: sIdx })
                .eq('id', procId)
                .eq('organization_id', orgId)

            if (error) {
                return actionError(error.message)
            }

            try {
                revalidatePath('/procedures')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess(undefined)
        }
    )(id, stepIndex)
}

export async function getNewProcedureOptions() {
    return createOrgAction(
        async ({ supabase, orgId }) => {
            // Fetch Clients
            const { data: clients } = await supabase
                .from('clients')
                .select('id, full_name')
                .eq('organization_id', orgId)
                .order('full_name', { ascending: true })

            // Fetch Templates
            const { data: templates } = await supabase
                .from('procedure_templates')
                .select('id, name')
                .eq('organization_id', orgId)
                .eq('is_active', true)
                .eq('is_archived', false)
                .order('name', { ascending: true })

            return actionSuccess({
                clients: clients || [],
                templates: templates || []
            })
        }
    )()
}

export async function getTemplatesAction() {
    return createOrgAction(
        async ({ supabase, orgId }) => {
            const { data: templates, error } = await supabase
                .from('procedure_templates')
                .select('id, name')
                .eq('organization_id', orgId)
                .eq('is_active', true)
                .eq('is_archived', false)
                .order('name', { ascending: true })

            if (error) {
                return actionError(error.message)
            }

            return actionSuccess(templates || [])
        }
    )()
}

export async function updateProcedureStepsProgressAction(procedureId: string, stepsProgress: Record<string, boolean>) {
    return createOrgAction(
        async ({ supabase, orgId }, procId: string, sProgress: Record<string, boolean>) => {
            const { error: updateError } = await supabase
                .from('procedures')
                .update({ steps_progress: sProgress })
                .eq('id', procId)
                .eq('organization_id', orgId)

            if (updateError) {
                return actionError(updateError.message)
            }

            return actionSuccess(undefined)
        }
    )(procedureId, stepsProgress)
}
