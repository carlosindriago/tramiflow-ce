'use server'

import { revalidatePath } from 'next/cache'
import { type Document, actionSuccess, actionError } from '@carlosindriago/core'
import { createOrgAction } from '@/lib/action-helpers'

type ProcedureDocumentJoin = {
  document: Document | Document[] | null
}

// Link a document to a procedure
export async function linkDocumentToProcedureAction(procedureId: string, documentId: string) {
  return createOrgAction(
    async ({ supabase }, procId: string, docId: string) => {
      // Check if link exists
      const { data: existing } = await supabase
        .from('procedure_documents')
        .select('procedure_id')
        .eq('procedure_id', procId)
        .eq('document_id', docId)
        .maybeSingle()

      if (existing) {
        return actionSuccess(null) // Idempotent
      }

      const { error } = await supabase
        .from('procedure_documents')
        .insert({
          procedure_id: procId,
          document_id: docId
        })

      if (error) {
        return actionError(error.message)
      }

      try {
        revalidatePath(`/procedures/${procId}`)
      } catch (e) {
        console.warn('revalidatePath error ignored:', e)
      }

      return actionSuccess(null)
    }
  )(procedureId, documentId)
}

// Unlink a document from a procedure
export async function unlinkDocumentFromProcedureAction(procedureId: string, documentId: string) {
  return createOrgAction(
    async ({ supabase }, procId: string, docId: string) => {
      const { error } = await supabase
        .from('procedure_documents')
        .delete()
        .eq('procedure_id', procId)
        .eq('document_id', docId)

      if (error) {
        return actionError(error.message)
      }

      try {
        revalidatePath(`/procedures/${procId}`)
      } catch (e) {
        console.warn('revalidatePath error ignored:', e)
      }

      return actionSuccess(null)
    }
  )(procedureId, documentId)
}

// Get documents for a specific procedure (via junction table)
export async function getProcedureDocumentsAction(procedureId: string) {
  return createOrgAction(
    async ({ supabase }, procId: string) => {
      const { data, error } = await supabase
        .from('procedure_documents')
        .select(`
          document:documents (*)
        `)
        .eq('procedure_id', procId)

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
  )(procedureId)
}
