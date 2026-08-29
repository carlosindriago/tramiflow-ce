import { createClient } from '@carlosindriago/database/server'
import type { Json } from '@carlosindriago/database'
import { saveDocumentTemplateSchema, extractVariablesFromAST } from '@carlosindriago/core'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET() {
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

        const { data, error } = await supabase
            .from('document_templates')
            .select('*')
            .eq('organization_id', member.organization_id)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('[GET /api/documents/templates] Query error:', error)
            const errorMsg = error.code === '42P01'
                ? 'La tabla de plantillas de documentos aún no está creada en la base de datos.'
                : error.message
            return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: data || [] })
    } catch (error) {
        console.error('Unexpected error in GET /api/documents/templates:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}

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
        const parsed = saveDocumentTemplateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Validación fallida', fieldErrors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
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

        let savedData
        if (id) {
            const { data, error } = await supabase
                .from('document_templates')
                .update(payload)
                .eq('id', id)
                .eq('organization_id', member.organization_id)
                .select()
                .maybeSingle()

            if (error) {
                console.error('[POST /api/documents/templates] Update Error:', error)
                const errorMsg = error.code === '42P01'
                    ? 'La tabla document_templates no existe en Supabase. Ejecuta la migración SQL en tu proyecto de Supabase.'
                    : error.message
                return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
            }
            savedData = data
        } else {
            const { data, error } = await supabase
                .from('document_templates')
                .insert(payload)
                .select()
                .maybeSingle()

            if (error) {
                console.error('[POST /api/documents/templates] Insert Error:', error)
                const errorMsg = error.code === '42P01'
                    ? 'La tabla document_templates no existe en Supabase. Ejecuta la migración SQL en tu proyecto de Supabase.'
                    : error.message
                return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
            }
            savedData = data
        }

        try {
            revalidatePath('/documents/templates')
            if (id) revalidatePath(`/documents/templates/${id}`)
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return NextResponse.json({ success: true, data: savedData })
    } catch (error) {
        console.error('Unexpected error in POST /api/documents/templates:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) {
            return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
        }

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

        const { error } = await supabase
            .from('document_templates')
            .delete()
            .eq('id', id)
            .eq('organization_id', member.organization_id)

        if (error) {
            console.error('[DELETE /api/documents/templates] Error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        try {
            revalidatePath('/documents/templates')
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unexpected error in DELETE /api/documents/templates:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
