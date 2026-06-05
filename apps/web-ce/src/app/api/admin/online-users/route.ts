import { createClient } from '@tramiflow/database/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/online-users
 * Returns users active in the last N minutes.
 * Uses SECURITY DEFINER function to bypass profiles RLS.
 * Requires caller to be an admin (checked here).
 */
export async function GET(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify caller is an admin
    const { data: admin } = await supabase
        .from('app_admins')
        .select('role')
        .eq('user_id', user.id)
        .single()

    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const minutes = parseInt(url.searchParams.get('minutes') ?? '10', 10)

    const { data, error } = await supabase.rpc('get_online_users', {
        threshold_minutes: minutes,
    })

    if (error) {
        console.error('[online-users]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data ?? [] })
}
