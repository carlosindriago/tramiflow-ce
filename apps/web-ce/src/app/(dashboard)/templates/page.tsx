import { createClient } from '@carlosindriago/database/server'
import { TemplatesView } from '@/components/templates/templates-view'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Get Organization (Assume first one found, similar to Dashboard)
    const { data: members } = await supabase.from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }) // First created or last? Dashboard uses limit 1.
        .limit(1)

    const orgId = members?.[0]?.organization_id

    // If no org, redirect to onboarding (standard flow)
    if (!orgId) {
        redirect('/onboarding')
    }

    // Fetch templates for the organization
    const { data: templates } = await supabase
        .from('procedure_templates')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_archived', false)
    const mappedTemplates = (templates || []).map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        fees_professional: t.fees ?? 0,
        fees_official: t.government_fee ?? 0,
        currency: t.currency ?? 'USD',
        duration_work: t.duration_work ?? 0,
        duration_resolution: t.duration_resolution ?? 0,
        is_active: t.is_active ?? true,
        steps: Array.isArray(t.steps) ? t.steps : null,
        created_at: t.created_at ?? '',
    }))

    return <TemplatesView templates={mappedTemplates} />
}
