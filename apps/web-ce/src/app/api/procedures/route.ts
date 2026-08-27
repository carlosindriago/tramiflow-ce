import { createClient } from '@carlosindriago/database/server'
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
            return NextResponse.json({ success: false, error: 'No se encontró organización activa vinculada' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('procedures')
            .select(`
                *,
                client:clients(id, full_name, email),
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
            .eq('organization_id', member.organization_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching procedures in GET /api/procedures:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        const procedures = (data || []).map(p => ({
            ...p,
            status: p.status_id,
        }))

        return NextResponse.json({ success: true, data: procedures })
    } catch (error) {
        console.error('Unexpected error in GET /api/procedures:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado del servidor'
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
            return NextResponse.json({ success: false, error: 'No se encontró organización activa vinculada' }, { status: 400 })
        }

        const body = await req.json()
        const { clientId, templateId } = body || {}

        if (!clientId || !templateId) {
            return NextResponse.json({ success: false, error: 'Cliente y plantilla son requeridos' }, { status: 400 })
        }

        // Check Plan Limits
        const { checkLimit } = await import('@carlosindriago/database/limits')
        const limitStatus = await checkLimit(member.organization_id, 'procedures', supabase)

        if (limitStatus.status === 'unverified_blocked') {
            return NextResponse.json({ success: false, error: 'UNVERIFIED_BLOCKED' }, { status: 403 })
        }

        if (limitStatus.status === 'blocked') {
            return NextResponse.json({ success: false, error: 'LIMIT_REACHED' }, { status: 403 })
        }

        // Ensure profile exists in public.profiles to satisfy Foreign Key constraint
        try {
            await supabase
                .from('profiles')
                .upsert({ id: user.id, email: user.email }, { onConflict: 'id', ignoreDuplicates: true })
        } catch (profileErr) {
            console.warn('Profile upsert warning:', profileErr)
        }

        // 1. Fetch Template to copy details
        const { data: template, error: templateError } = await supabase
            .from('procedure_templates')
            .select('*')
            .eq('id', templateId)
            .maybeSingle()

        if (templateError || !template) {
            return NextResponse.json({ success: false, error: 'Plantilla no encontrada' }, { status: 404 })
        }

        // 2. Fetch Initial Status (Order 1)
        let { data: initialStatus } = await supabase
            .from('procedure_statuses')
            .select('id')
            .eq('organization_id', member.organization_id)
            .order('order_index', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (!initialStatus) {
            const { seedDefaultProcedureStatuses } = await import('@/app/(dashboard)/settings/statuses/actions')
            await seedDefaultProcedureStatuses(member.organization_id)

            const refetch = await supabase
                .from('procedure_statuses')
                .select('id')
                .eq('organization_id', member.organization_id)
                .order('order_index', { ascending: true })
                .limit(1)
                .maybeSingle()

            initialStatus = refetch.data
            if (!initialStatus) {
                return NextResponse.json(
                    { success: false, error: 'No se encontraron estados configurados para la organización' },
                    { status: 400 }
                )
            }
        }

        // 3. Initialize checklist progress (all false)
        const initialChecklist: Record<string, boolean> = {}
        const reqs = Array.isArray(template.requirements) ? template.requirements : []

        reqs.forEach((req: unknown) => {
            if (typeof req === 'object' && req !== null && 'id' in req && typeof (req as { id: unknown }).id === 'string') {
                initialChecklist[(req as { id: string }).id] = false
            }
        })

        // 4. Create Procedure
        const { data: newProcedure, error: createError } = await supabase
            .from('procedures')
            .insert({
                organization_id: member.organization_id,
                created_by: user.id,
                client_id: clientId,
                template_id: templateId,
                title: template.name,
                status: 'pending_docs',
                status_id: initialStatus.id,
                checklist_progress: initialChecklist,
                current_step_index: 0,
                payment_status: 'pending',
                requirements_snapshot: reqs,
            })
            .select()
            .maybeSingle()

        if (createError || !newProcedure) {
            console.error('Error creating procedure in POST /api/procedures:', createError)
            return NextResponse.json(
                { success: false, error: createError?.message || 'Error al crear el trámite' },
                { status: 500 }
            )
        }

        try {
            revalidatePath('/procedures')
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return NextResponse.json({
            success: true,
            data: { ...newProcedure, status: newProcedure.status_id },
        })
    } catch (error) {
        console.error('Unexpected error in POST /api/procedures:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado del servidor'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
