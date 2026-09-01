import { notFound, redirect } from 'next/navigation'
import { createClient } from '@carlosindriago/database/server'
import {
    DocumentReviewView,
    type GeneratedDocWithDetails,
} from '@/components/document-builder/document-review-view'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function DocumentReviewPage({ params }: PageProps) {
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
        .from('generated_documents')
        .select(`
            *,
            template:document_templates(
                id,
                title,
                margins,
                paper_config
            ),
            client:clients(
                id,
                full_name
            )
        `)
        .eq('id', id)
        .eq('organization_id', member.organization_id)
        .maybeSingle()

    if (error || !data) {
        notFound()
    }

    return <DocumentReviewView document={data as unknown as GeneratedDocWithDetails} />
}
