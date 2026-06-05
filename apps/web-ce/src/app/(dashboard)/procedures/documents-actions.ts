'use server'

import { createClient } from '@tramiflow/database/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@tramiflow/database/types'

type Document = Database['public']['Tables']['documents']['Row']
type ProcedureDocumentJoin = {
  document: Document | Document[] | null
}

// Link a document to a procedure
export async function linkDocumentToProcedureAction(procedureId: string, documentId: string) {
  try {
    const supabase = await createClient()

    // Check if link exists
    const { data: existing } = await supabase
      .from('procedure_documents')
      .select('procedure_id')
      .eq('procedure_id', procedureId)
      .eq('document_id', documentId)
      .maybeSingle()

    if (existing) {
      return { success: true, message: 'Already linked' } // Idempotent
    }

    const { error } = await supabase
      .from('procedure_documents')
      .insert({
        procedure_id: procedureId,
        document_id: documentId
      })

    if (error) throw error

    revalidatePath(`/procedures/${procedureId}`)
    return { success: true }
  } catch (error) {
    console.error('Error linking document:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Unlink a document from a procedure
export async function unlinkDocumentFromProcedureAction(procedureId: string, documentId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('procedure_documents')
      .delete()
      .eq('procedure_id', procedureId)
      .eq('document_id', documentId)

    if (error) throw error

    revalidatePath(`/procedures/${procedureId}`)
    return { success: true }
  } catch (error) {
    console.error('Error unlinking document:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Get documents for a specific procedure (via junction table)
export async function getProcedureDocumentsAction(procedureId: string) {
  try {
    const supabase = await createClient()

    // We fetch from procedure_documents joined with documents
    const { data, error } = await supabase
      .from('procedure_documents')
      .select(`
        document:documents (*)
      `)
      .eq('procedure_id', procedureId)

    if (error) throw error

    // Transform result to array of documents
    const docs = data.map((item: ProcedureDocumentJoin) => {
      const doc = Array.isArray(item.document) ? item.document[0] : item.document
      return doc
    }).filter(Boolean) as Document[]

    // Generate signed URLs for all documents
    if (docs.length > 0) {
      const { data: signedUrls, error: signedUrlError } = await supabase
        .storage
        .from('client-docs')
        .createSignedUrls(
          docs.map((d) => d.storage_path),
          60 * 60 // 1 hour expiry
        )

      if (!signedUrlError && signedUrls) {
        return {
          success: true,
          data: docs.map((doc, index) => ({
            ...doc,
            url: signedUrls[index]?.signedUrl || ''
          }))
        }
      }
    }

    return { success: true, data: docs }
  } catch (error) {
    console.error('Error fetching procedure documents:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
