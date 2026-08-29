'use server'

import { revalidatePath } from 'next/cache'
import type { Json } from '@carlosindriago/database'
import {
    createGeneratedDocumentSchema,
    hydrateASTWithData,
    actionSuccess,
    actionError,
    type CreateGeneratedDocumentInput,
    type GeneratedDocumentModel,
    type JSONContentNode,
    type PaperConfiguration,
    type DocumentStatus,
} from '@carlosindriago/core'
import { createOrgAction } from '@/lib/action-helpers'

/**
 * Server Action to instantiate and generate a document from a template
 */
export const createGeneratedDocumentAction = createOrgAction(
    async ({ supabase, orgId }, rawInput: CreateGeneratedDocumentInput) => {
        const parsed = createGeneratedDocumentSchema.safeParse(rawInput)
        if (!parsed.success) {
            return actionError('Validación fallida', parsed.error.flatten().fieldErrors)
        }

        const { template_id, client_id, title, form_data, paper_config, status } = parsed.data

        // 1. Fetch template AST and paper config safely on the server
        const { data: template, error: templateError } = await supabase
            .from('document_templates')
            .select('content_ast, paper_config')
            .eq('id', template_id)
            .eq('organization_id', orgId)
            .maybeSingle()

        if (templateError || !template) {
            return actionError('La plantilla de origen no existe o no tienes acceso.')
        }

        // 2. Hydrate AST on the server side
        const finalAST = hydrateASTWithData(template.content_ast as unknown as JSONContentNode, form_data)

        // 3. Save instantiated document
        const { data: generatedDoc, error: insertError } = await supabase
            .from('generated_documents')
            .insert({
                organization_id: orgId,
                template_id,
                client_id: client_id || null,
                title,
                final_ast: finalAST as unknown as Json,
                form_data: form_data as unknown as Json,
                paper_config: (paper_config || (template.paper_config as unknown as PaperConfiguration) || { format: 'a4' }) as unknown as Json,
                status: status || 'draft',
            })
            .select()
            .maybeSingle()

        if (insertError || !generatedDoc) {
            console.error('[createGeneratedDocumentAction] Insert error:', insertError)
            const errorMsg =
                insertError?.code === '42P01'
                    ? 'La tabla generated_documents no existe en la base de datos.'
                    : insertError?.message || 'Error al guardar el documento generado'
            return actionError(errorMsg)
        }

        revalidatePath('/documents/templates')
        revalidatePath(`/documents/review/${generatedDoc.id}`)
        if (client_id) revalidatePath(`/clients/${client_id}`)

        return actionSuccess(generatedDoc as unknown as GeneratedDocumentModel)
    }
)

/**
 * Server Action to update an existing generated document (e.g. after manual editing or reviewing)
 */
export const updateGeneratedDocumentAction = createOrgAction(
    async (
        { supabase, orgId },
        input: {
            id: string
            title?: string
            final_ast?: JSONContentNode | Record<string, unknown>
            paper_config?: PaperConfiguration | null
            status?: DocumentStatus
        }
    ) => {
        const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }

        if (input.title !== undefined) updatePayload.title = input.title
        if (input.final_ast !== undefined) updatePayload.final_ast = input.final_ast as unknown as Json
        if (input.paper_config !== undefined) updatePayload.paper_config = input.paper_config as unknown as Json
        if (input.status !== undefined) updatePayload.status = input.status

        const { data, error } = await supabase
            .from('generated_documents')
            .update(updatePayload)
            .eq('id', input.id)
            .eq('organization_id', orgId)
            .select()
            .maybeSingle()

        if (error || !data) {
            console.error('[updateGeneratedDocumentAction] Update error:', error)
            return actionError(error?.message || 'Error al actualizar el documento')
        }

        revalidatePath(`/documents/review/${input.id}`)
        revalidatePath('/documents/templates')

        return actionSuccess(data as unknown as GeneratedDocumentModel)
    }
)
