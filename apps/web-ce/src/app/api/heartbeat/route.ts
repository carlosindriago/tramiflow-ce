import { createClient } from '@carlosindriago/database/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/heartbeat
 * Updates last_seen_at for the authenticated user.
 * Called by useHeartbeat() every 5 minutes from the client.
 * Fire-and-forget — always responds 200.
 */
export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ ok: false }, { status: 401 })
        }

        await supabase
            .from('profiles')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', user.id)

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ ok: true }) // silent fail — don't break the app
    }
}
