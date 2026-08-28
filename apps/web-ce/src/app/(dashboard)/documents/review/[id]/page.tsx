import { notFound } from 'next/navigation'
import { getGeneratedDocAction } from '@/app/(dashboard)/documents/generate/actions'
import { DocumentReviewView } from '@/components/document-builder/document-review-view'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function DocumentReviewPage({ params }: PageProps) {
    const { id } = await params
    const res = await getGeneratedDocAction(id)

    if (!res.success || !res.data) {
        notFound()
    }

    return <DocumentReviewView document={res.data} />
}
