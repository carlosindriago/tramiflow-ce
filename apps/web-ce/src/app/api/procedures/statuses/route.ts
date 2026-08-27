import { createClient } from '@carlosindriago/database/server'
import { NextResponse } from 'next/server'

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
            .from('procedure_statuses')
            .select('*')
            .eq('organization_id', member.organization_id)
            .order('order_index', { ascending: true })

        if (error) {
            console.error('Error fetching statuses in GET /api/procedures/statuses:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: data || [] })
    } catch (error) {
        console.error('Unexpected error in GET /api/procedures/statuses:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado del servidor'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
