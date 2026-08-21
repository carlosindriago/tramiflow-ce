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
            console.error('Validation error on saveTemplateAction:', parsed.error.flatten())
            return actionError('Validación fallida', parsed.error.flatten().fieldErrors)
        }

        // Prepare steps with sequential order index
        const stepsWithOrder = (parsed.data.steps || []).map((step, index) => ({
            ...step,
            order_index: index,
        }))

        // Consolidate rich configuration in public_settings JSONB
        const publicSettings = {
            ...(parsed.data.public_settings || {}),
            currency: parsed.data.currency || 'PEN',
            duration_work: parsed.data.durationWork ?? 5,
            duration_resolution: parsed.data.durationResolution ?? 0,
            is_custom_category: parsed.data.isCustomCategory ?? false,
            requires_renewal: parsed.data.requiresRenewal ?? false,
            renewal_frequency: parsed.data.renewalFrequency ?? null,
            allow_copy: parsed.data.public_settings?.allow_copy ?? true,
            show_fees: parsed.data.public_settings?.show_fees ?? true,
            show_requirements: parsed.data.public_settings?.show_requirements ?? true,
            show_steps: parsed.data.public_settings?.show_steps ?? true,
        }

        const templateData = {
            organization_id: orgId,
            created_by: user.id, // Required by RLS policy
            name: parsed.data.name,
            category: parsed.data.category || null,

            fees: parsed.data.feesProfessional ?? 0,
            government_fee: parsed.data.feesOfficial ?? 0,
            payment_terms: parsed.data.paymentTerms || 'upfront',

            is_active: parsed.data.isActive ?? true,
            requirements: parsed.data.requirements || [],
            steps: stepsWithOrder,
            visibility: parsed.data.visibility || 'private',
            public_settings: publicSettings,
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
                .maybeSingle()
            result = { data, error }
        } else {
            // INSERT
            const { data, error } = await supabase
                .from('procedure_templates')
                .insert(templateData)
                .select('id')
                .maybeSingle()
            result = { data, error }
        }

        if (result.error || !result.data) {
            console.error('Supabase error saving template:', result.error)
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
            .maybeSingle()

        if (fetchError || !original) {
            return actionError('Plantilla no encontrada')
        }

        // 2. Create copy data
        const copyData = {
            organization_id: orgId,
            created_by: user.id,
            name: `${original.name} (Copia)`,
            category: original.category,

            fees: original.fees,
            government_fee: original.government_fee,
            payment_terms: original.payment_terms,

            is_active: false, // Default to inactive for safety
            requirements: original.requirements,
            steps: original.steps,
            visibility: 'private',
            public_settings: original.public_settings,
        }

        // 3. Insert copy
        const { data: newTemplate, error: insertError } = await supabase
            .from('procedure_templates')
            .insert(copyData)
            .select('id')
            .maybeSingle()

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
            .update({ is_publicly_visible: isPublic, visibility: isPublic ? 'public' : 'private' })
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
