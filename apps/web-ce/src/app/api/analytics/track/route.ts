import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { event, data } = body

        if (!event || typeof event !== 'string') {
            return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => req.cookies.getAll(),
                    setAll: () => { }, // Response cookies not needed; fire-and-forget
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()

        // Get the user's organization
        let organizationId: string | null = null
        if (user) {
            const { data: membership } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .limit(1)
                .single()
            organizationId = membership?.organization_id ?? null
        }

        // Insert the event — non-blocking, responds with 202 immediately after insert
        await supabase.from('usage_logs').insert({
            user_id: user?.id ?? null,
            organization_id: organizationId,
            event_name: event,
            metadata: data && typeof data === 'object' ? data : null,
        })

        return NextResponse.json({ ok: true }, { status: 202 })
    } catch {
        // Never let telemetry crash the app
        return NextResponse.json({ ok: false }, { status: 202 })
    }
}
