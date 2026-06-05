// @ts-nocheck
'use server'

import { createClient } from '@tramiflow/database/server'
import { templateSchema, type TemplateFormData } from '@tramiflow/core'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveTemplateAction(input: TemplateFormData & { id?: string }) {
    const supabase = await createClient()

    // Auth check
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Get organization from member
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!member?.organization_id) {
        return { success: false, error: 'No organization found' }
    }

    // Validate input
    const parsed = templateSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors }
    }

    // Prepare data
    const stepsWithOrder = parsed.data.steps.map((step, index) => ({
        ...step,
        order_index: index,
    }))

    const templateData = {
        organization_id: member.organization_id,
        created_by: user.id, // Required by RLS policy
        name: parsed.data.name,

        // Fees
        fees: parsed.data.feesProfessional ?? 0,
        government_fee: parsed.data.feesOfficial ?? 0,
        currency: parsed.data.currency,
        payment_terms: parsed.data.paymentTerms,

        // Duration
        duration_work: parsed.data.durationWork,
        duration_resolution: parsed.data.durationResolution ?? 0,

        // Category & Config
        category: parsed.data.category || null,
        is_custom_category: parsed.data.isCustomCategory,
        requires_renewal: parsed.data.requiresRenewal,
        renewal_frequency: parsed.data.renewalFrequency || null,

        is_active: parsed.data.isActive,
        requirements: parsed.data.requirements,
        steps: stepsWithOrder,
    }

    let result
    if (input.id) {
        // UPDATE
        const { data, error } = await supabase
            .from('procedure_templates')
            .update(templateData)
            .eq('id', input.id)
            .eq('organization_id', member.organization_id) // Security check
            .select('id')
            .single()
        result = { data, error }
    } else {
        // INSERT
        const { data, error } = await supabase
            .from('procedure_templates')
            .insert(templateData)
            .select('id')
            .single()
        result = { data, error }
    }

    if (result.error || !result.data) {
        console.error('Supabase error:', result.error)
        return { success: false, error: result.error?.message || 'Unknown error' }
    }

    revalidatePath('/templates')
    return { success: true, id: result.data.id }
}

export async function deleteTemplate(id: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!member?.organization_id) throw new Error('No organization')

    const { logAudit } = await import('@tramiflow/core/server')
    const { error } = await supabase
        .from('procedure_templates')
        .update({ is_archived: true })
        .eq('id', id)
        .eq('organization_id', member.organization_id)

    if (error) {
        console.error('Archive error:', error)
        return { success: false, error: error.message }
    }

    await logAudit(member.organization_id, 'TEMPLATE_ARCHIVED', id, 'template')

    revalidatePath('/templates')
    return { success: true }
}

export async function duplicateTemplate(originalId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!member?.organization_id) throw new Error('No organization')

    // 1. Get original template
    const { data: original, error: fetchError } = await supabase
        .from('procedure_templates')
        .select('*')
        .eq('id', originalId)
        .eq('organization_id', member.organization_id)
        .single()

    if (fetchError || !original) {
        return { success: false, error: 'Template not found' }
    }

    // 2. Create copy data
    const copyData = {
        organization_id: member.organization_id,
        name: `${original.name} (Copia)`,

        fees: original.fees,
        government_fee: original.government_fee,
        currency: original.currency,
        payment_terms: original.payment_terms,

        duration_work: original.duration_work,
        duration_resolution: original.duration_resolution,

        category: original.category,
        is_custom_category: original.is_custom_category,
        requires_renewal: original.requires_renewal,
        renewal_frequency: original.renewal_frequency,

        is_active: false, // Default to inactive for safety
        steps: original.steps,
    }

    // 3. Insert copy
    const { data: newTemplate, error: insertError } = await supabase
        .from('procedure_templates')
        .insert(copyData)
        .select('id')
        .single()

    if (insertError) {
        return { success: false, error: insertError.message }
    }

    revalidatePath('/templates')
    redirect(`/templates/${newTemplate.id}`)
}

export async function toggleTemplateVisibility(id: string, isPublic: boolean) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!member?.organization_id) throw new Error('No organization')

    const { error } = await supabase
        .from('procedure_templates')
        .update({ is_publicly_visible: isPublic })
        .eq('id', id)
        .eq('organization_id', member.organization_id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath(`/templates/${id}`)
    revalidatePath(`/shared/templates/${id}`)
    return { success: true }
}
