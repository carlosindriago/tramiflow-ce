'use server'

import {
    createGeneratedDocumentSchema,
    type CreateGeneratedDocumentInput,
    type GeneratedDocumentModel,
    type DocumentMargins,
    hydrateASTWithData,
    actionSuccess,
    actionError,
} from '@carlosindriago/core'
import type { Json } from '@carlosindriago/database'
import { revalidatePath } from 'next/cache'
import { createOrgAction } from '@/lib/action-helpers'

/**
 * Generate a new document by hydrating a template AST with user-provided form data.
 */
export async function createGeneratedDocAction(input: CreateGeneratedDocumentInput) {
    return createOrgAction(async ({ supabase, orgId }, dataInput: CreateGeneratedDocumentInput) => {
        const parsed = createGeneratedDocumentSchema.safeParse(dataInput)
        if (!parsed.success) {
            return actionError('Validación fallida', parsed.error.flatten().fieldErrors)
        }

        const { template_id, client_id, title, form_data } = parsed.data

        // 1. Fetch template AST
        const { data: template, error: templateError } = await supabase
            .from('document_templates')
            .select('content_ast')
            .eq('id', template_id)
            .eq('organization_id', orgId)
            .maybeSingle()

        if (templateError || !template) {
            return actionError('La plantilla de origen no existe o no tienes acceso.')
        }

        // 2. Hydrate AST on the server side
        const finalAST = hydrateASTWithData(template.content_ast, form_data)

        // 3. Save instantiated document
        const insertPayload = {
            organization_id: orgId,
            template_id,
            client_id: client_id || null,
            title,
            final_ast: finalAST as unknown as Json,
            form_data: form_data as unknown as Json,
        }

        const { data: generatedDoc, error: insertError } = await supabase
            .from('generated_documents')
            .insert(insertPayload)
            .select()
            .maybeSingle()

        if (insertError || !generatedDoc) {
            console.error('[createGeneratedDocAction] Insert error:', insertError)
            return actionError(insertError?.message || 'Error al guardar el documento generado')
        }

        try {
            revalidatePath('/documents/templates')
            revalidatePath(`/documents/review/${generatedDoc.id}`)
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return actionSuccess(generatedDoc as unknown as GeneratedDocumentModel)
    })(input)
}

/**
 * Get generated document by ID
 */
export async function getGeneratedDocAction(docId: string) {
    return createOrgAction(async ({ supabase, orgId }, id: string) => {
        const { data, error } = await supabase
            .from('generated_documents')
            .select(`
                *,
                template:document_templates(
                    id,
                    title,
                    margins
                ),
                client:clients(
                    id,
                    full_name
                )
            `)
            .eq('id', id)
            .eq('organization_id', orgId)
            .maybeSingle()

        if (error || !data) {
            console.error('[getGeneratedDocAction] Error:', error)
            return actionError(error?.message || 'Documento no encontrado')
        }

        return actionSuccess(data as unknown as GeneratedDocumentModel & {
            template?: { id: string; title: string; margins?: DocumentMargins } | null
            client?: { id: string; full_name: string } | null
        })
    })(docId)
}

/**
 * Update generated document final AST (e.g. after manual edits in Review View)
 */
export async function updateGeneratedDocAction({
    id,
    title,
    final_ast,
}: {
    id: string
    title?: string
    final_ast: Record<string, unknown>
}) {
    return createOrgAction(async ({ supabase, orgId }) => {
        const payload: { final_ast: Json; updated_at: string; title?: string } = {
            final_ast: final_ast as unknown as Json,
            updated_at: new Date().toISOString(),
        }
        if (title) payload.title = title

        const { data, error } = await supabase
            .from('generated_documents')
            .update(payload)
            .eq('id', id)
            .eq('organization_id', orgId)
            .select()
            .maybeSingle()

        if (error || !data) {
            return actionError(error?.message || 'Error al actualizar documento')
        }

        try {
            revalidatePath(`/documents/review/${id}`)
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return actionSuccess(data as unknown as GeneratedDocumentModel)
    })()
}

/**
 * Server Action to convert HTML to DOCX buffer (base64)
 */
export async function exportDocxAction({
    html,
    title,
    margins,
}: {
    html: string
    title: string
    margins?: DocumentMargins
}) {
    return createOrgAction(async () => {
        try {
            const htmlToDocx = (await import('html-to-docx')).default
            const docxMargins = {
                top: Math.round((margins?.top || 20) * 56.7),
                right: Math.round((margins?.right || 20) * 56.7),
                bottom: Math.round((margins?.bottom || 20) * 56.7),
                left: Math.round((margins?.left || 20) * 56.7),
            }

            const buffer = await htmlToDocx(html, null, {
                title,
                margins: docxMargins,
            })

            const base64 = Buffer.from(buffer as ArrayBuffer).toString('base64')
            return actionSuccess({ base64 })
        } catch (err) {
            console.error('[exportDocxAction] Error generating docx:', err)
            const message = err instanceof Error ? err.message : 'Error al generar archivo Word'
            return actionError(message)
        }
    })()
}
