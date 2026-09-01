import { createClient } from '@carlosindriago/database/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Json } from '@carlosindriago/database'

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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

        const body = await req.json().catch(() => null)
        if (!body) {
            return NextResponse.json({ success: false, error: 'Cuerpo de la petición inválido' }, { status: 400 })
        }

        const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }

        if (body.title !== undefined) updatePayload.title = body.title
        if (body.final_ast !== undefined) updatePayload.final_ast = body.final_ast as Json
        if (body.form_data !== undefined) updatePayload.form_data = body.form_data as Json
        if (body.paper_config !== undefined) updatePayload.paper_config = body.paper_config as Json
        if (body.status !== undefined) updatePayload.status = body.status

        const { data, error } = await supabase
            .from('generated_documents')
            .update(updatePayload)
            .eq('id', id)
            .eq('organization_id', member.organization_id)
            .select()
            .maybeSingle()

        if (error || !data) {
            console.error('[PATCH /api/documents/generated/[id]] Error:', error)
            return NextResponse.json({ success: false, error: error?.message || 'Error al actualizar el documento' }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Unexpected error in PATCH /api/documents/generated/[id]:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado del servidor'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
