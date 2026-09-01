'use server'

import type { Json } from '@carlosindriago/database'
import {
    saveDocumentTemplateSchema,
    extractVariablesFromAST,
    actionSuccess,
    actionError,
    type DocumentTemplateModel,
    type SaveDocumentTemplateInput,
} from '@carlosindriago/core'
import { createOrgAction } from '@/lib/action-helpers'

/**
 * Server Action to save or update a Document Template
 */
export const saveTemplateAction = createOrgAction(
    async ({ supabase, orgId }, rawInput: SaveDocumentTemplateInput) => {
        const parsed = saveDocumentTemplateSchema.safeParse(rawInput)
        if (!parsed.success) {
            return actionError('Validación fallida', parsed.error.flatten().fieldErrors)
        }

        const { id, title, content_ast, margins, paper_config, status } = parsed.data
        const extractedVars = extractVariablesFromAST(content_ast)

        const payload = {
            title,
            content_ast: content_ast as unknown as Json,
            variables: extractedVars as unknown as Json,
            margins: margins as unknown as Json,
            paper_config: (paper_config || { format: 'a4' }) as unknown as Json,
            status: status || 'draft',
            organization_id: orgId,
            updated_at: new Date().toISOString(),
        }

        if (id) {
            const { data, error } = await supabase
                .from('document_templates')
                .update(payload)
                .eq('id', id)
                .eq('organization_id', orgId)
                .select()
                .maybeSingle()

            if (error || !data) {
                console.error('[saveTemplateAction] Update Error:', error)
                return actionError(error?.message || 'Error al actualizar la plantilla')
            }

            return actionSuccess(data as unknown as DocumentTemplateModel)
        }

        const { data, error } = await supabase
            .from('document_templates')
            .insert(payload)
            .select()
            .maybeSingle()

        if (error || !data) {
            console.error('[saveTemplateAction] Insert Error:', error)
            const errorMsg =
                error?.code === '42P01'
                    ? 'La tabla de plantillas no existe en la base de datos.'
                    : error?.message || 'Error al crear la plantilla'
            return actionError(errorMsg)
        }

        return actionSuccess(data as unknown as DocumentTemplateModel)
    }
)

/**
 * Server Action to delete a Document Template
 */
export const deleteTemplateAction = createOrgAction(
    async ({ supabase, orgId }, id: string) => {
        const { error } = await supabase
            .from('document_templates')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)

        if (error) {
            console.error('[deleteTemplateAction] Delete error:', error)
            return actionError(error.message)
        }

        return actionSuccess({ id })
    }
)

/**
 * Server Action to fetch all Document Templates for the active organization
 */
export const getDocumentTemplatesAction = createOrgAction(
    async ({ supabase, orgId }) => {
        const { data, error } = await supabase
            .from('document_templates')
            .select('*')
            .eq('organization_id', orgId)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('[getDocumentTemplatesAction] Query error:', error)
            return actionError(error.message)
        }

        return actionSuccess((data || []) as unknown as DocumentTemplateModel[])
    }
)
