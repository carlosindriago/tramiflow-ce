'use server'

import {
    saveDocumentTemplateSchema,
    type SaveDocumentTemplateInput,
    type DocumentTemplateModel,
    extractVariablesFromAST,
    actionSuccess,
    actionError,
} from '@carlosindriago/core'
import type { Json } from '@carlosindriago/database'
import { revalidatePath } from 'next/cache'
import { createOrgAction } from '@/lib/action-helpers'

/**
 * List all document templates for the active organization
 */
export async function getDocumentTemplatesAction() {
    return createOrgAction(async ({ supabase, orgId }) => {
        const { data, error } = await supabase
            .from('document_templates')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[getDocumentTemplatesAction] Error:', error)
            return actionError(error.message)
        }

        return actionSuccess((data || []) as unknown as DocumentTemplateModel[])
    })()
}

/**
 * Fetch a single document template by ID
 */
export async function getDocumentTemplateAction(templateId: string) {
    return createOrgAction(async ({ supabase, orgId }, id: string) => {
        const { data, error } = await supabase
            .from('document_templates')
            .select('*')
            .eq('id', id)
            .eq('organization_id', orgId)
            .maybeSingle()

        if (error || !data) {
            console.error('[getDocumentTemplateAction] Error:', error)
            return actionError(error?.message || 'Plantilla de documento no encontrada')
        }

        return actionSuccess(data as unknown as DocumentTemplateModel)
    })(templateId)
}

/**
 * Create or update a document template
 */
export async function saveDocumentTemplateAction(input: SaveDocumentTemplateInput) {
    return createOrgAction(async ({ supabase, orgId }, dataInput: SaveDocumentTemplateInput) => {
        const parsed = saveDocumentTemplateSchema.safeParse(dataInput)
        if (!parsed.success) {
            return actionError('Validación fallida', parsed.error.flatten().fieldErrors)
        }

        const { id, title, content_ast, margins } = parsed.data

        // Extract variables from the AST automatically
        const extractedVars = extractVariablesFromAST(content_ast)

        const payload = {
            title,
            content_ast: content_ast as unknown as Json,
            variables: extractedVars as unknown as Json,
            margins: margins as unknown as Json,
            organization_id: orgId,
            updated_at: new Date().toISOString(),
        }

        let savedData: DocumentTemplateModel | null = null

        if (id) {
            // Update existing template
            const { data, error } = await supabase
                .from('document_templates')
                .update(payload)
                .eq('id', id)
                .eq('organization_id', orgId)
                .select()
                .maybeSingle()

            if (error || !data) {
                console.error('[saveDocumentTemplateAction] Update Error:', error)
                return actionError(error?.message || 'Error al actualizar la plantilla')
            }
            savedData = data as unknown as DocumentTemplateModel
        } else {
            // Create new template
            const { data, error } = await supabase
                .from('document_templates')
                .insert(payload)
                .select()
                .maybeSingle()

            if (error || !data) {
                console.error('[saveDocumentTemplateAction] Insert Error:', error)
                return actionError(error?.message || 'Error al crear la plantilla')
            }
            savedData = data as unknown as DocumentTemplateModel
        }

        try {
            revalidatePath('/documents/templates')
            if (id) revalidatePath(`/documents/templates/${id}`)
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return actionSuccess(savedData as unknown as DocumentTemplateModel)
    })(input)
}

/**
 * Delete a document template
 */
export async function deleteDocumentTemplateAction(templateId: string) {
    return createOrgAction(async ({ supabase, orgId }, id: string) => {
        const { error } = await supabase
            .from('document_templates')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)

        if (error) {
            console.error('[deleteDocumentTemplateAction] Error:', error)
            return actionError(error.message)
        }

        try {
            revalidatePath('/documents/templates')
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return actionSuccess(undefined)
    })(templateId)
}
