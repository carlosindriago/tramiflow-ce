'use server'

import { templateSchema, type TemplateFormData, actionSuccess, actionError } from '@carlosindriago/core'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createOrgAction } from '@/lib/action-helpers'

export async function saveTemplateAction(input: TemplateFormData & { id?: string }) {
    return createOrgAction(
        async ({ supabase, orgId, user }, data: TemplateFormData & { id?: string }) => {
            // Validate input
            const parsed = templateSchema.safeParse(data)
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

            // Ensure profile exists in public.profiles to satisfy FK constraint
            try {
                await supabase
                    .from('profiles')
                    .upsert({ id: user.id, email: user.email }, { onConflict: 'id', ignoreDuplicates: true })
            } catch (profileErr) {
                console.warn('Profile upsert warning:', profileErr)
            }

            const templateData = {
                organization_id: orgId,
                created_by: user.id, // Required by RLS policy
                name: parsed.data.name,
                category: parsed.data.category || null,

                fees: parsed.data.feesProfessional ?? 0,
                fees_professional: parsed.data.feesProfessional ?? 0,
                fees_official: parsed.data.feesOfficial ?? 0,
                government_fee: parsed.data.feesOfficial ?? 0,
                payment_terms: parsed.data.paymentTerms || 'upfront',
                currency: parsed.data.currency || 'PEN',

                duration_work: parsed.data.durationWork ?? 5,
                duration_resolution: parsed.data.durationResolution ?? 0,
                is_custom_category: parsed.data.isCustomCategory ?? false,
                requires_renewal: parsed.data.requiresRenewal ?? false,
                renewal_frequency: parsed.data.renewalFrequency ?? null,

                is_active: parsed.data.isActive ?? true,
                requirements: parsed.data.requirements || [],
                steps: stepsWithOrder,
                visibility: parsed.data.visibility || 'private',
                public_settings: publicSettings,
            }

            let result
            if (data.id) {
                // UPDATE
                const { data: updated, error } = await supabase
                    .from('procedure_templates')
                    .update(templateData)
                    .eq('id', data.id)
                    .eq('organization_id', orgId)
                    .select('id')
                    .maybeSingle()
                result = { data: updated, error }
            } else {
                // INSERT
                const { data: inserted, error } = await supabase
                    .from('procedure_templates')
                    .insert(templateData)
                    .select('id')
                    .maybeSingle()
                result = { data: inserted, error }
            }

            if (result.error || !result.data) {
                console.error('Supabase error saving template:', result.error)
                return actionError(result.error?.message || 'Error al guardar plantilla')
            }

            try {
                revalidatePath('/templates')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess({ id: result.data.id })
        }
    )(input)
}

export async function deleteTemplate(id: string) {
    return createOrgAction(
        async ({ supabase, orgId }, templateId: string) => {
            const { error } = await supabase
                .from('procedure_templates')
                .update({ is_archived: true })
                .eq('id', templateId)
                .eq('organization_id', orgId)

            if (error) {
                console.error('Archive error:', error)
                return actionError(error.message)
            }

            try {
                const { logAudit } = await import('@carlosindriago/core/server')
                await logAudit(orgId, 'TEMPLATE_ARCHIVED', templateId, 'template')
            } catch (auditErr) {
                console.warn('logAudit failed:', auditErr)
            }

            try {
                revalidatePath('/templates')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess(undefined)
        }
    )(id)
}

export async function duplicateTemplate(originalId: string) {
    return createOrgAction(
        async ({ supabase, orgId, user }, templateId: string) => {
            // 1. Get original template
            const { data: original, error: fetchError } = await supabase
                .from('procedure_templates')
                .select('*')
                .eq('id', templateId)
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

            try {
                revalidatePath('/templates')
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            redirect(`/templates/${newTemplate.id}`)
        }
    )(originalId)
}

export async function toggleTemplateVisibility(id: string, isPublic: boolean) {
    return createOrgAction(
        async ({ supabase, orgId }, templateId: string, pub: boolean) => {
            const { error } = await supabase
                .from('procedure_templates')
                .update({ is_publicly_visible: pub, visibility: pub ? 'public' : 'private' })
                .eq('id', templateId)
                .eq('organization_id', orgId)

            if (error) {
                return actionError(error.message)
            }

            try {
                revalidatePath(`/templates/${templateId}`)
                revalidatePath(`/shared/templates/${templateId}`)
            } catch (e) {
                console.warn('revalidatePath error ignored:', e)
            }

            return actionSuccess(undefined)
        }
    )(id, isPublic)
}
