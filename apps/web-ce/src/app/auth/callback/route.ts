import { createClient } from '@carlosindriago/database/server'
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
            // Track IP Address & Country
            const forwardedFor = request.headers.get('x-forwarded-for')
            const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
            const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || 'LOCAL'
            const sessionUuid = crypto.randomUUID()

            await supabase.auth.updateUser({
                data: {
                    session_uuid: sessionUuid,
                    last_country: country,
                }
            })

            if (ip !== 'unknown') {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('registration_ip')
                    .eq('id', session.user.id)
                    .single()

                const updateData: { last_ip: string; registration_ip?: string } = { last_ip: ip }
                if (profile && !profile.registration_ip) {
                    updateData.registration_ip = ip
                }

                await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', session.user.id)
            }

            const response = NextResponse.redirect(new URL(next, request.url))
            response.cookies.set('tf_session_id', sessionUuid, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
            })

            return response
        }
    }

    // Auth error - redirect to login with error param
    return NextResponse.redirect(new URL('/login?error=auth', request.url))
}
