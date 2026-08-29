import { createClient } from '@carlosindriago/database/server'
import { redirect } from 'next/navigation'
import { DocumentTemplatesList } from '@/components/document-builder/document-templates-list'
import type { DocumentTemplateModel } from '@carlosindriago/core'

export const dynamic = 'force-dynamic'

export default async function DocumentTemplatesPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    if (!member?.organization_id) {
        redirect('/onboarding')
    }

    const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[DocumentTemplatesPage] Supabase query error:', error)
    }

    const templates = (data || []) as unknown as DocumentTemplateModel[]

    return <DocumentTemplatesList templates={templates} />
}
