import { createClient } from '@carlosindriago/database/server'
import { createClientSchema, type Client } from '@carlosindriago/core'
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

        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .eq('organization_id', member.organization_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching clients in GET /api/clients:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: (clients || []) as Client[] })
    } catch (error) {
        console.error('Unexpected error in GET /api/clients:', error)
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
        const parsed = createClientSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Validación fallida', fieldErrors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        // Check Plan Limits
        const { checkLimit } = await import('@carlosindriago/database/limits')
        const limitStatus = await checkLimit(member.organization_id, 'clients', supabase)

        if (limitStatus.status === 'unverified_blocked') {
            return NextResponse.json({ success: false, error: 'UNVERIFIED_BLOCKED' }, { status: 403 })
        }

        if (limitStatus.status === 'blocked') {
            return NextResponse.json({ success: false, error: 'Has alcanzado el límite de clientes de tu plan actual.' }, { status: 403 })
        }

        const { lead_id, ...clientData } = parsed.data

        const insertPayload = {
            full_name: clientData.full_name,
            identifications: clientData.identifications || [],
            nationality: clientData.nationality || null,
            phone: clientData.phone || null,
            email: clientData.email || null,
            notes: clientData.notes || null,
            organization_id: member.organization_id,
        }

        const { data: newClient, error } = await supabase
            .from('clients')
            .insert(insertPayload)
            .select()
            .maybeSingle()

        if (error || !newClient) {
            console.error('Error creating client in POST /api/clients:', error)
            return NextResponse.json(
                { success: false, error: error?.message || 'Error al crear cliente' },
                { status: 500 }
            )
        }

        // Update Lead Status if present
        if (lead_id) {
            await supabase
                .from('leads')
                .update({ status: 'converted' })
                .eq('id', lead_id)
                .eq('organization_id', member.organization_id)
        }

        try {
            revalidatePath('/clients')
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return NextResponse.json({ success: true, data: newClient as Client })
    } catch (error) {
        console.error('Unexpected error in POST /api/clients:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado del servidor'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
