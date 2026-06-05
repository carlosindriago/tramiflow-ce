import { createClient } from '@/lib/supabase/server'
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
        .order('created_at', { ascending: false })

    return <TemplatesView templates={templates || []} />
}
