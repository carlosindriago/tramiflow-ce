'use server'

import { revalidatePath } from 'next/cache'
import { type Document } from '@carlosindriago/core'
import { actionSuccess, actionError } from '@carlosindriago/core'
import { createOrgAction } from '@/lib/action-helpers'

type ProcedureDocumentJoin = {
  document: Document | Document[] | null
}

// Link a document to a procedure
export const linkDocumentToProcedureAction = createOrgAction(
  async ({ supabase }, procedureId: string, documentId: string) => {
    // Check if link exists
    const { data: existing } = await supabase
      .from('procedure_documents')
      .select('procedure_id')
      .eq('procedure_id', procedureId)
      .eq('document_id', documentId)
      .maybeSingle()

    if (existing) {
      return actionSuccess(null) // Idempotent
    }

    const { error } = await supabase
      .from('procedure_documents')
      .insert({
        procedure_id: procedureId,
        document_id: documentId
      })

    if (error) {
      return actionError(error.message)
    }

    revalidatePath(`/procedures/${procedureId}`)
    return actionSuccess(null)
  }
)

// Unlink a document from a procedure
export const unlinkDocumentFromProcedureAction = createOrgAction(
  async ({ supabase }, procedureId: string, documentId: string) => {
    const { error } = await supabase
      .from('procedure_documents')
      .delete()
      .eq('procedure_id', procedureId)
      .eq('document_id', documentId)

    if (error) {
      return actionError(error.message)
    }

    revalidatePath(`/procedures/${procedureId}`)
    return actionSuccess(null)
  }
)

// Get documents for a specific procedure (via junction table)
export const getProcedureDocumentsAction = createOrgAction(
  async ({ supabase }, procedureId: string) => {
    const { data, error } = await supabase
      .from('procedure_documents')
      .select(`
        document:documents (*)
      `)
      .eq('procedure_id', procedureId)

    if (error) {
      return actionError(error.message)
    }

    // Transform result to array of documents
    const docs = (data || []).map((item: unknown) => {
      const joinItem = item as ProcedureDocumentJoin
      const doc = Array.isArray(joinItem.document) ? joinItem.document[0] : joinItem.document
      return doc
    }).filter(Boolean) as Document[]

    // Generate signed URLs for all documents with 60s ephemeral expiry
    if (docs.length > 0) {
      const { data: signedUrls, error: signedUrlError } = await supabase
        .storage
        .from('client-docs')
        .createSignedUrls(
          docs.map((d) => d.storage_path),
          60 // 60s ephemeral expiry
        )

      if (!signedUrlError && signedUrls) {
        return actionSuccess(docs.map((doc, index) => ({
          ...doc,
          url: signedUrls[index]?.signedUrl || ''
        })))
      }
    }

    return actionSuccess(docs)
  }
)
