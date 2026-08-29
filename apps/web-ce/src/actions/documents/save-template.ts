'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@carlosindriago/database/server'
import type { Json } from '@carlosindriago/database'
import {
    saveDocumentTemplateSchema,
    extractVariablesFromAST,
    actionSuccess,
    actionError,
    type ActionResult,
    type DocumentTemplateModel,
    type SaveDocumentTemplateInput,
} from '@carlosindriago/core'

/**
 * Server Action to save or update a Document Template
 */
export async function saveTemplateAction(
    rawInput: SaveDocumentTemplateInput
): Promise<ActionResult<DocumentTemplateModel>> {
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

        const parsed = saveDocumentTemplateSchema.safeParse(rawInput)
        if (!parsed.success) {
            return actionError('Validación fallida', parsed.error.flatten().fieldErrors)
        }

        const { id, title, content_ast, margins, paper_config } = parsed.data
        const extractedVars = extractVariablesFromAST(content_ast)

        const payload = {
            title,
            content_ast: content_ast as unknown as Json,
            variables: extractedVars as unknown as Json,
            margins: margins as unknown as Json,
            paper_config: (paper_config || { format: 'a4' }) as unknown as Json,
            organization_id: member.organization_id,
            updated_at: new Date().toISOString(),
        }

        if (id) {
            const { data, error } = await supabase
                .from('document_templates')
                .update(payload)
                .eq('id', id)
                .eq('organization_id', member.organization_id)
                .select()
                .maybeSingle()

            if (error || !data) {
                console.error('[saveTemplateAction] Update Error:', error)
                return actionError(error?.message || 'Error al actualizar la plantilla')
            }

            revalidatePath('/documents/templates')
            return actionSuccess(data as unknown as DocumentTemplateModel)
        }

        const { data, error } = await supabase
            .from('document_templates')
            .insert(payload)
            .select()
            .maybeSingle()

        if (error || !data) {
            console.error('[saveTemplateAction] Insert Error:', error)
            const errorMsg = error?.code === '42P01'
                ? 'La tabla de plantillas no existe en la base de datos.'
                : error?.message || 'Error al crear la plantilla'
            return actionError(errorMsg)
        }

        revalidatePath('/documents/templates')
        return actionSuccess(data as unknown as DocumentTemplateModel)
    } catch (error) {
        console.error('Unexpected error in saveTemplateAction:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return actionError(message)
    }
}

/**
 * Server Action to delete a Document Template
 */
export async function deleteTemplateAction(
    id: string
): Promise<ActionResult<{ id: string }>> {
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

        const { error } = await supabase
            .from('document_templates')
            .delete()
            .eq('id', id)
            .eq('organization_id', member.organization_id)

        if (error) {
            console.error('[deleteTemplateAction] Delete error:', error)
            return actionError(error.message)
        }

        revalidatePath('/documents/templates')
        return actionSuccess({ id })
    } catch (error) {
        console.error('Unexpected error in deleteTemplateAction:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return actionError(message)
    }
}

/**
 * Server Action to fetch all Document Templates for the active organization
 */
export async function getDocumentTemplatesAction(): Promise<ActionResult<DocumentTemplateModel[]>> {
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

        const { data, error } = await supabase
            .from('document_templates')
            .select('*')
            .eq('organization_id', member.organization_id)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('[getDocumentTemplatesAction] Query error:', error)
            return actionError(error.message)
        }

        return actionSuccess((data || []) as unknown as DocumentTemplateModel[])
    } catch (error) {
        console.error('Unexpected error in getDocumentTemplatesAction:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return actionError(message)
    }
}
