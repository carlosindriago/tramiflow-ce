'use server'

import { templateSchema, type TemplateFormData, actionSuccess, actionError } from '@carlosindriago/core'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createOrgAction } from '@/lib/action-helpers'

export const saveTemplateAction = createOrgAction(
    async ({ supabase, orgId, user }, input: TemplateFormData & { id?: string }) => {
        // Validate input
        const parsed = templateSchema.safeParse(input)
        if (!parsed.success) {
            return actionError('Validación fallida', parsed.error.flatten().fieldErrors)
        }

        // Prepare data
        const stepsWithOrder = parsed.data.steps.map((step, index) => ({
            ...step,
            order_index: index,
        }))

        const templateData = {
            organization_id: orgId,
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
                .eq('organization_id', orgId)
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
            return actionError(result.error?.message || 'Error al guardar plantilla')
        }

        revalidatePath('/templates')
        return actionSuccess({ id: result.data.id })
    }
)

export const deleteTemplate = createOrgAction(
    async ({ supabase, orgId }, id: string) => {
        const { error } = await supabase
            .from('procedure_templates')
            .update({ is_archived: true })
            .eq('id', id)
            .eq('organization_id', orgId)

        if (error) {
            console.error('Archive error:', error)
            return actionError(error.message)
        }

        const { logAudit } = await import('@carlosindriago/core/server')
        await logAudit(orgId, 'TEMPLATE_ARCHIVED', id, 'template')

        revalidatePath('/templates')
        return actionSuccess(undefined)
    }
)

export const duplicateTemplate = createOrgAction(
    async ({ supabase, orgId, user }, originalId: string) => {
        // 1. Get original template
        const { data: original, error: fetchError } = await supabase
            .from('procedure_templates')
            .select('*')
            .eq('id', originalId)
            .eq('organization_id', orgId)
            .single()

        if (fetchError || !original) {
            return actionError('Plantilla no encontrada')
        }

        // 2. Create copy data
        const copyData = {
            organization_id: orgId,
            created_by: user.id,
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

        if (insertError || !newTemplate) {
            return actionError(insertError?.message || 'Error al duplicar plantilla')
        }

        revalidatePath('/templates')
        redirect(`/templates/${newTemplate.id}`)
    }
)

export const toggleTemplateVisibility = createOrgAction(
    async ({ supabase, orgId }, id: string, isPublic: boolean) => {
        const { error } = await supabase
            .from('procedure_templates')
            .update({ is_publicly_visible: isPublic })
            .eq('id', id)
            .eq('organization_id', orgId)

        if (error) {
            return actionError(error.message)
        }

        revalidatePath(`/templates/${id}`)
        revalidatePath(`/shared/templates/${id}`)
        return actionSuccess(undefined)
    }
)
