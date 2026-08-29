'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@carlosindriago/database/server'
import type { Json } from '@carlosindriago/database'
import {
    createGeneratedDocumentSchema,
    hydrateASTWithData,
    actionSuccess,
    actionError,
    type ActionResult,
    type CreateGeneratedDocumentInput,
    type GeneratedDocumentModel,
    type JSONContentNode,
    type PaperConfiguration,
} from '@carlosindriago/core'

/**
 * Server Action to instantiate and generate a document from a template
 */
export async function createGeneratedDocumentAction(
    rawInput: CreateGeneratedDocumentInput
): Promise<ActionResult<GeneratedDocumentModel>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return actionError('No autenticado')
        }

        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError || !member?.organization_id) {
            return actionError('No se encontró organización activa')
        }

        const parsed = createGeneratedDocumentSchema.safeParse(rawInput)
        if (!parsed.success) {
            return actionError('Validación fallida', parsed.error.flatten().fieldErrors)
        }

        const { template_id, client_id, title, form_data, paper_config } = parsed.data

        // 1. Fetch template AST and paper config safely on the server
        const { data: template, error: templateError } = await supabase
            .from('document_templates')
            .select('content_ast, paper_config')
            .eq('id', template_id)
            .eq('organization_id', member.organization_id)
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
                organization_id: member.organization_id,
                template_id,
                client_id: client_id || null,
                title,
                final_ast: finalAST as unknown as Json,
                form_data: form_data as unknown as Json,
                paper_config: (paper_config || (template.paper_config as unknown as PaperConfiguration) || { format: 'a4' }) as unknown as Json,
            })
            .select()
            .maybeSingle()

        if (insertError || !generatedDoc) {
            console.error('[createGeneratedDocumentAction] Insert error:', insertError)
            const errorMsg = insertError?.code === '42P01'
                ? 'La tabla generated_documents no existe en la base de datos.'
                : (insertError?.message || 'Error al guardar el documento generado')
            return actionError(errorMsg)
        }

        revalidatePath('/documents/templates')
        revalidatePath(`/documents/review/${generatedDoc.id}`)
        if (client_id) revalidatePath(`/clients/${client_id}`)

        return actionSuccess(generatedDoc as unknown as GeneratedDocumentModel)
    } catch (error) {
        console.error('Unexpected error in createGeneratedDocumentAction:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return actionError(message)
    }
}

/**
 * Server Action to update an existing generated document (e.g. after manual editing or reviewing)
 */
export async function updateGeneratedDocumentAction(input: {
    id: string
    title?: string
    final_ast?: JSONContentNode | Record<string, unknown>
    paper_config?: PaperConfiguration | null
}): Promise<ActionResult<GeneratedDocumentModel>> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return actionError('No autenticado')
        }

        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError || !member?.organization_id) {
            return actionError('No se encontró organización activa')
        }

        const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }

        if (input.title !== undefined) updatePayload.title = input.title
        if (input.final_ast !== undefined) updatePayload.final_ast = input.final_ast as unknown as Json
        if (input.paper_config !== undefined) updatePayload.paper_config = input.paper_config as unknown as Json

        const { data, error } = await supabase
            .from('generated_documents')
            .update(updatePayload)
            .eq('id', input.id)
            .eq('organization_id', member.organization_id)
            .select()
            .maybeSingle()

        if (error || !data) {
            console.error('[updateGeneratedDocumentAction] Update error:', error)
            return actionError(error?.message || 'Error al actualizar el documento')
        }

        revalidatePath(`/documents/review/${input.id}`)
        revalidatePath('/documents/templates')

        return actionSuccess(data as unknown as GeneratedDocumentModel)
    } catch (error) {
        console.error('Unexpected error in updateGeneratedDocumentAction:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return actionError(message)
    }
}
