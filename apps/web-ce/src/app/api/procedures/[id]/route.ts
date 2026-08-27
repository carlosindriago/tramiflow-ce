import { createClient } from '@carlosindriago/database/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(
    _req: NextRequest,
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
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
        }

        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError || !member?.organization_id) {
            return NextResponse.json({ success: false, error: 'No se encontró organización activa vinculada' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('procedures')
            .select(`
                *,
                client:clients(id, full_name, email, phone, identifications),
                template:procedure_templates(
                    id,
                    name,
                    requirements,
                    steps,
                    fees_professional:fees,
                    fees_official:government_fee
                ),
                status_details:procedure_statuses(*)
            `)
            .eq('id', id)
            .eq('organization_id', member.organization_id)
            .maybeSingle()

        if (error || !data) {
            return NextResponse.json({ success: false, error: error?.message || 'Trámite no encontrado' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: { ...data, status: data.status_id } })
    } catch (error) {
        console.error('Error in GET /api/procedures/[id]:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}

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
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
        }

        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError || !member?.organization_id) {
            return NextResponse.json({ success: false, error: 'No se encontró organización activa vinculada' }, { status: 400 })
        }

        const body = await req.json()
        const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        }

        if (body.status_id !== undefined) updatePayload.status_id = body.status_id
        if (body.checklist_progress !== undefined) updatePayload.checklist_progress = body.checklist_progress
        if (body.payment_status !== undefined) updatePayload.payment_status = body.payment_status
        if (body.current_step_index !== undefined) updatePayload.current_step_index = body.current_step_index
        if (body.steps_progress !== undefined) updatePayload.steps_progress = body.steps_progress

        const { data, error } = await supabase
            .from('procedures')
            .update(updatePayload)
            .eq('id', id)
            .eq('organization_id', member.organization_id)
            .select()
            .maybeSingle()

        if (error) {
            console.error('Error updating procedure in PATCH /api/procedures/[id]:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        try {
            revalidatePath('/procedures')
            revalidatePath(`/procedures/${id}`)
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Error in PATCH /api/procedures/[id]:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
