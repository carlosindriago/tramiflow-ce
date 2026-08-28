import { notFound } from 'next/navigation'
import { getDocumentTemplateAction } from '../actions'
import { TemplateBuilderView } from '@/components/document-builder/template-builder-view'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditDocumentTemplatePage({ params }: PageProps) {
    const { id } = await params
    const res = await getDocumentTemplateAction(id)

    if (!res.success || !res.data) {
        notFound()
    }

    return <TemplateBuilderView initialTemplate={res.data} />
}
