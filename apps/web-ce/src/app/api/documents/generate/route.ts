import { createClient } from '@carlosindriago/database/server'
import { NextRequest, NextResponse } from 'next/server'
import {
    createGeneratedDocumentSchema,
    hydrateASTWithData,
    type JSONContentNode,
    type PaperConfiguration,
    type GeneratedDocumentModel,
} from '@carlosindriago/core'
import type { Json } from '@carlosindriago/database'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'No autenticado. Inicia sesión nuevamente.' }, { status: 401 })
        }

        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError || !member?.organization_id) {
            return NextResponse.json({ success: false, error: 'No se encontró una organización activa vinculada.' }, { status: 400 })
        }

        const orgId = member.organization_id
        const body = await req.json().catch(() => null)

        if (!body) {
            return NextResponse.json({ success: false, error: 'Cuerpo de la petición inválido' }, { status: 400 })
        }

        const parsed = createGeneratedDocumentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({
                success: false,
                error: 'Validación fallida',
                details: parsed.error.flatten().fieldErrors,
            }, { status: 400 })
        }

        const { template_id, client_id, title, form_data, paper_config, status } = parsed.data

        // 1. Fetch template AST and paper config safely
        const { data: template, error: templateError } = await supabase
            .from('document_templates')
            .select('content_ast, paper_config')
            .eq('id', template_id)
            .eq('organization_id', orgId)
            .maybeSingle()

        if (templateError || !template) {
            return NextResponse.json({
                success: false,
                error: 'La plantilla de origen no existe o no tienes acceso a ella.',
            }, { status: 404 })
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
            console.error('[POST /api/documents/generate] Insert error:', insertError)
            return NextResponse.json({
                success: false,
                error: insertError?.message || 'Error al guardar el documento generado',
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data: generatedDoc as unknown as GeneratedDocumentModel,
        }, { status: 201 })
    } catch (error) {
        console.error('Unexpected error in POST /api/documents/generate:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado del servidor'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
