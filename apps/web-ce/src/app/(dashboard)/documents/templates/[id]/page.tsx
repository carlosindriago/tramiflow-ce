import { notFound, redirect } from 'next/navigation'
import { createClient } from '@carlosindriago/database/server'
import { TemplateBuilderView } from '@/components/document-builder/template-builder-view'
import type { DocumentTemplateModel } from '@carlosindriago/core'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditDocumentTemplatePage({ params }: PageProps) {
    const { id } = await params
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
        .eq('id', id)
        .eq('organization_id', member.organization_id)
        .maybeSingle()

    if (error || !data) {
        notFound()
    }

    return <TemplateBuilderView initialTemplate={data as unknown as DocumentTemplateModel} />
}
