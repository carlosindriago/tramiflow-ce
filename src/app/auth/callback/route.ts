import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const searchParams = new URL(request.url).searchParams
    const code = searchParams.get('code')
    let next = searchParams.get('next') ?? '/'
    
    // Prevent Open Redirect: ensure next is a relative path and not a protocol-relative URL
    if (!next.startsWith('/') || next.startsWith('//')) {
        next = '/'
    }

    if (code) {
        const supabase = await createClient()
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && session) {
            // Track IP Address
            const forwardedFor = request.headers.get('x-forwarded-for')
            const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

            if (ip !== 'unknown') {
                // Update last_ip, and conditionally set registration_ip if it's the first time
                await supabase.rpc('update_user_ip', {
                    p_user_id: session.user.id,
                    p_ip: ip
                })
                // Fallback direct update (since RPC might not exist yet)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('registration_ip')
                    .eq('id', session.user.id)
                    .single()

/* eslint-disable */
                const updateData: any = { last_ip: ip }
                if (profile && !profile.registration_ip) {
                    updateData.registration_ip = ip
                }

                await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', session.user.id)
            }

            return NextResponse.redirect(new URL(next, request.url))
        }
    }

    // Auth error - redirect to login with error param
    return NextResponse.redirect(new URL('/login?error=auth', request.url))
}
