'use server'

import { createClient } from '@carlosindriago/database/server'
import { revalidatePath } from 'next/cache'
/* eslint-disable */
import { redirect } from 'next/navigation'
/* eslint-disable */
import { ProcedureStatus, ProcedureChecklistProgress } from '@carlosindriago/core'

export async function getProcedureStatusesAction() {
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
        .select('*')
        .eq('organization_id', member.organization_id)
        .order('order_index', { ascending: true })

    if (error) {
        console.error('Error fetching statuses:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function getProceduresAction(includeArchived: boolean = false) {
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

    // Build query with optional archived filter
    // Use inner join to filter by related table's is_final field
    let query = supabase
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
        .eq('organization_id', member.organization_id)

    // Filter by archived status using the relationship
    // For procedures: we filter on status_id relationship
    if (!includeArchived) {
        // Active: use not.foreignTable filter or fetch all and filter in memory
        // Since Supabase doesn't support easy nested filters, we'll filter in memory
        query = query.order('created_at', { ascending: false })
    } else {
        query = query.order('created_at', { ascending: false })
    }

/* eslint-disable */
    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching procedures:', error)
        return { success: false, error: error.message }
    }

    // Filter by archived status in memory (using the joined status_details)
    let procedures = data?.map(p => ({
        ...p,
        status: p.status_id,
    })) || []

    // Apply the filter based on is_final from status_details
    if (!includeArchived) {
        // Active: filter out final statuses
        procedures = procedures.filter(p => !p.status_details?.is_final)
    } else {
        // Archived: only final statuses
        procedures = procedures.filter(p => p.status_details?.is_final)
    }

    return { success: true, data: procedures }
}

export async function getProcedureByIdAction(id: string) {
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
        .eq('id', id)
        .eq('organization_id', member.organization_id)
        .single()

    if (error) {
        console.error('Error fetching procedure:', error)
        return { success: false, error: error.message }
    }

    const procedure = {
        ...data,
        status: data.status_id,
    }

    return { success: true, data: procedure }
}

export async function createProcedureAction(input: {
    clientId: string
    templateId: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return { success: false, error: 'No organization' }

    // Check Plan Limits
    const { checkLimit } = await import('@carlosindriago/database/limits')
    const limitStatus = await checkLimit(member.organization_id, 'procedures', supabase)

    if (limitStatus.status === 'unverified_blocked') {
        return { success: false, error: 'UNVERIFIED_BLOCKED' }
    }

    if (limitStatus.status === 'blocked') {
        return { success: false, error: 'LIMIT_REACHED' }
    }

    // 1. Fetch Template to copy details
    const { data: template, error: templateError } = await supabase
        .from('procedure_templates')
        .select('*')
        .eq('id', input.templateId)
        .single()

    if (templateError || !template) {
        return { success: false, error: 'Template not found' }
    }

    // 2. Fetch Initial Status (Order 1)
    let { data: initialStatus } = await supabase
        .from('procedure_statuses')
        .select('id')
        .eq('organization_id', member.organization_id)
        .order('order_index', { ascending: true })
        .limit(1)
        .single()

    if (!initialStatus) {
        const { seedDefaultProcedureStatuses } = await import('@/app/(dashboard)/settings/statuses/actions')
        await seedDefaultProcedureStatuses(member.organization_id)

        const refetch = await supabase
            .from('procedure_statuses')
            .select('id')
            .eq('organization_id', member.organization_id)
            .order('order_index', { ascending: true })
            .limit(1)
            .single()
            
        initialStatus = refetch.data
        if (!initialStatus) {
            return { success: false, error: 'No statuses defined for organization even after seeding' }
        }
    }

    // 3. Initialize checklist progress (all false)
    const initialChecklist: ProcedureChecklistProgress = {}
    // Ensure template.requirements is handled correctly whether it's JSON or array
    const reqs = Array.isArray(template.requirements) ? template.requirements : []

    reqs.forEach((req: unknown) => {
        if (typeof req === 'object' && req !== null && 'id' in req && typeof req.id === 'string') {
            initialChecklist[req.id] = false
        } else if (typeof req === 'string') {
            // handle string requirements? usually they are objects
            // initialChecklist[req] = false
        }
    })


// 4. Create Procedure
  const { data: newProcedure, error: createError } = await supabase
    .from('procedures')
    .insert({
      organization_id: member.organization_id,
      client_id: input.clientId,
      template_id: input.templateId,
      title: template.name,
            status: 'pending_docs', // Legacy field 
            status_id: initialStatus.id, // New field
            checklist_progress: initialChecklist,
            current_step_index: 0,
            payment_status: 'pending',
            requirements_snapshot: reqs
        })
        .select()
        .single()

    if (createError) {
        return { success: false, error: createError.message }
    }

    revalidatePath('/procedures')
    return { success: true, data: { ...newProcedure, status: newProcedure.status_id } }
}

export async function updateProcedureStatusAction(id: string, statusId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('procedures')
        .update({ status_id: statusId }) // Update status_id
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    return { success: true }
}

export async function updateProcedureChecklistAction(id: string, checklist: ProcedureChecklistProgress) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('procedures')
        .update({ checklist_progress: checklist })
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/procedures')
    return { success: true }
}

export async function updateProcedurePaymentStatusAction(id: string, status: 'pending' | 'partial' | 'paid') {
    const supabase = await createClient()
    const { error } = await supabase
        .from('procedures')
        .update({ payment_status: status })
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/procedures')
    return { success: true }
}

export async function updateProcedureStepAction(id: string, stepIndex: number) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('procedures')
        .update({ current_step_index: stepIndex })
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/procedures')
    return { success: true }
}

export async function getNewProcedureOptions() {
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

    // Fetch Clients
    const { data: clients } = await supabase
        .from('clients')
        .select('id, full_name')
        .eq('organization_id', member.organization_id)
        .order('full_name', { ascending: true })

    // Fetch Templates
    const { data: templates } = await supabase
        .from('procedure_templates')
        .select('id, name')
        .eq('organization_id', member.organization_id)
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('name', { ascending: true })

    return {
        success: true,
        data: {
            clients: clients || [],
            templates: templates || []
        }
    }
}

export async function getTemplatesAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return { success: false, error: 'No organization' }

    const { data: templates, error } = await supabase
        .from('procedure_templates')
        .select('id, name')
        .eq('organization_id', member.organization_id)
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('name', { ascending: true })

if (error) return { success: false, error: error.message }

  return { success: true, data: templates || [] }
}

export async function updateProcedureStepsProgressAction(
  procedureId: string,
  stepsProgress: Record<string, boolean>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Verify procedure belongs to user's organization via RLS
  const { data: procedure, error: fetchError } = await supabase
    .from('procedures')
    .select('organization_id')
    .eq('id', procedureId)
    .single()

  if (fetchError || !procedure) {
    return { success: false, error: 'Procedure not found' }
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', procedure.organization_id)
    .single()

  if (!member) {
    return { success: false, error: 'Forbidden' }
  }

  const { error: updateError } = await supabase
    .from('procedures')
    .update({ steps_progress: stepsProgress })
    .eq('id', procedureId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}
