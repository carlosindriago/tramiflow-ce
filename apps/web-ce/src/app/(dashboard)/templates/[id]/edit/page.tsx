import { createClient } from '@carlosindriago/database/server'
import { notFound, redirect } from 'next/navigation'
import { TemplateForm } from '@/components/templates/template-form'
import { TemplateFormData, StepType } from '@carlosindriago/core'

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
        .maybeSingle()

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
        steps: Array.isArray(template.steps) ? template.steps.map((s) => {
            const stepObj = typeof s === 'object' && s !== null ? (s as Record<string, unknown>) : {}
            return {
                stepId: typeof stepObj.stepId === 'string' ? stepObj.stepId : (typeof stepObj.id === 'string' ? stepObj.id : crypto.randomUUID()),
                title: typeof stepObj.title === 'string' ? stepObj.title : '',
                type: (typeof stepObj.type === 'string' ? stepObj.type : 'document') as StepType,
                description: typeof stepObj.description === 'string' ? stepObj.description : '',
                isRequired: typeof stepObj.isRequired === 'boolean' ? stepObj.isRequired : true,
                estimatedDays: typeof stepObj.estimatedDays === 'number' ? stepObj.estimatedDays : 5,
            }
        }) : [],

        // Map requirements from DB (strings or objects) to expected Form format
        requirements: Array.isArray(template.requirements)
            ? template.requirements.map((r) => {
                if (typeof r === 'string') {
                    return { id: crypto.randomUUID(), title: r }
                }
                const rObj = typeof r === 'object' && r !== null ? (r as Record<string, unknown>) : {}
                return {
                    id: typeof rObj.id === 'string' ? rObj.id : crypto.randomUUID(),
                    title: typeof rObj.title === 'string' ? rObj.title : ''
                }
            })
            : [],

        visibility: template.visibility || 'private',
        share_token: template.share_token || undefined,
        public_settings: (typeof template.public_settings === 'object' && template.public_settings !== null ? (template.public_settings as Record<string, unknown>) : {
            allow_copy: true,
            show_fees: true,
            show_requirements: true,
        }),
    } as TemplateFormData & { id: string }

    const { data: permissions } = await supabase
        .from('template_permissions')
        .select('*')
        .eq('template_id', template.id)

    return <TemplateForm initialData={formData} permissions={permissions || []} />
}
