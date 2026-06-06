// @ts-nocheck
import { createClient } from '@carlosindriago/database/server'
import { notFound, redirect } from 'next/navigation'
import { TemplateForm } from '@/components/templates/template-form'
import { TemplateFormData } from '@carlosindriago/core'

interface EditTemplatePageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // 1. Get Organization (Consistent with TemplatesPage)
    const { data: members } = await supabase.from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

    const organizationId = members?.[0]?.organization_id

    if (!organizationId) redirect('/login')

    const { data: template, error } = await supabase
        .from('procedure_templates')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

    if (error || !template) {
        notFound()
    }

    // Map DB data to Form Data
    const formData = {
        id: template.id,
        name: template.name,
        feesProfessional: template.fees_professional ?? undefined,
        feesOfficial: template.fees_official ?? undefined,
        currency: template.currency || 'PEN',
        paymentTerms: template.payment_terms || 'upfront',

        durationWork: template.duration_work ?? 1,
        durationResolution: template.duration_resolution ?? undefined,

        category: template.category || '',
        isCustomCategory: template.is_custom_category ?? false,
        requiresRenewal: template.requires_renewal ?? false,
        renewalFrequency: template.renewal_frequency ?? undefined,

        isActive: template.is_active ?? true,
/* eslint-disable */
        steps: Array.isArray(template.steps) ? template.steps.map((s: any) => ({
            stepId: s.stepId || s.id || crypto.randomUUID(),
            title: s.title,
            type: s.type,
            description: s.description,
            isRequired: s.isRequired,
            estimatedDays: s.estimatedDays,
        })) : [],

        // Fix: Map requirements from DB (strings or objects) to expected Form format
        requirements: Array.isArray(template.requirements)
/* eslint-disable */
            ? template.requirements.map((r: any) => {
                if (typeof r === 'string') {
                    return { id: crypto.randomUUID(), title: r }
                }
                return { id: r.id || crypto.randomUUID(), title: r.title || '' }
            })
            : [],

        visibility: template.visibility || 'private',
        share_token: template.share_token || undefined,
/* eslint-disable */
        public_settings: (template.public_settings as any) || {
            allow_copy: true,
            show_fees: true,
            show_requirements: true,
        },
    } as TemplateFormData & { id: string }

    const { data: permissions } = await supabase
        .from('template_permissions')
        .select('*')
        .eq('template_id', template.id)

    return <TemplateForm initialData={formData} permissions={permissions || []} />
}
