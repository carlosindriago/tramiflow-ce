import { createClient } from '@carlosindriago/database/server'
import type { Json } from '@carlosindriago/database'
import {
    createGeneratedDocumentSchema,
    hydrateASTWithData,
    type JSONContentNode,
    type PaperConfiguration,
} from '@carlosindriago/core'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
        }

        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError || !member?.organization_id) {
            return NextResponse.json({ success: false, error: 'No se encontró organización activa' }, { status: 400 })
        }

        const body = await req.json()
        const parsed = createGeneratedDocumentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Validación fallida', fieldErrors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { template_id, client_id, title, form_data, paper_config } = parsed.data

        // 1. Fetch template AST and paper config
        const { data: template, error: templateError } = await supabase
            .from('document_templates')
            .select('content_ast, paper_config')
            .eq('id', template_id)
            .eq('organization_id', member.organization_id)
            .maybeSingle()

        if (templateError || !template) {
            return NextResponse.json(
                { success: false, error: 'La plantilla de origen no existe o no tienes acceso.' },
                { status: 404 }
            )
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
            console.error('[POST /api/documents/generate] Insert error:', insertError)
            const errorMsg = insertError?.code === '42P01'
                ? 'La tabla generated_documents no existe en Supabase. Ejecuta la migración SQL en tu proyecto de Supabase.'
                : (insertError?.message || 'Error al guardar el documento generado')
            return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
        }

        try {
            revalidatePath('/documents/templates')
            revalidatePath(`/documents/review/${generatedDoc.id}`)
            if (client_id) revalidatePath(`/clients/${client_id}`)
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return NextResponse.json({ success: true, data: generatedDoc })
    } catch (error) {
        console.error('Unexpected error in POST /api/documents/generate:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
        }

        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError || !member?.organization_id) {
            return NextResponse.json({ success: false, error: 'No se encontró organización activa' }, { status: 400 })
        }

        const body = await req.json()
        const { id, title, final_ast, paper_config } = body
        if (!id) {
            return NextResponse.json({ success: false, error: 'ID del documento requerido' }, { status: 400 })
        }

        const payload: Record<string, unknown> = {
            final_ast,
            updated_at: new Date().toISOString(),
        }
        if (title) payload.title = title
        if (paper_config) payload.paper_config = paper_config

        const { data, error } = await supabase
            .from('generated_documents')
            .update(payload)
            .eq('id', id)
            .eq('organization_id', member.organization_id)
            .select()
            .maybeSingle()

        if (error || !data) {
            console.error('[PATCH /api/documents/generate] Update error:', error)
            return NextResponse.json({ success: false, error: error?.message || 'Error al actualizar documento' }, { status: 500 })
        }

        try {
            revalidatePath(`/documents/review/${id}`)
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Unexpected error in PATCH /api/documents/generate:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
