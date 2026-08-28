import { getDocumentTemplatesAction } from './actions'
import { DocumentTemplatesList } from '@/components/document-builder/document-templates-list'

export const dynamic = 'force-dynamic'

export default async function DocumentTemplatesPage() {
    const res = await getDocumentTemplatesAction()
    const templates = res.success && res.data ? res.data : []

    return <DocumentTemplatesList templates={templates} />
}
