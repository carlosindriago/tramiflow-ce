import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Forward Edge Country header
    const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || 'LOCAL'
    supabaseResponse.headers.set('x-user-country', country)

    // User verification and Zero-Latency Check
    const { data: { user } } = await supabase.auth.getUser()

    // Public routes that don't depend on auth
    const { pathname } = request.nextUrl
    const isApiRoute = pathname.startsWith('/api')

    // For API routes, allow Supabase session cookies to be passed without HTML redirecting
    if (isApiRoute) {
        return supabaseResponse
    }

    const publicRoutes = ['/login', '/auth/callback', '/shared', '/u/', '/templates/share', '/terms', '/privacy', '/help']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // 1. Auth Enforcement
    if (!user && !isPublicRoute) {
        if (request.cookies.has('tramiflow_setup_complete')) {
            supabaseResponse.cookies.delete('tramiflow_setup_complete')
        }
        if (request.cookies.has('tf_session_id')) {
            supabaseResponse.cookies.delete('tf_session_id')
        }

        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // 2. Single Session Enforcement (Zero-latency Edge verification)
    if (user && !isPublicRoute) {
        const expectedSessionId = user.user_metadata?.session_uuid
        const clientSessionId = request.cookies.get('tf_session_id')?.value

        if (expectedSessionId && clientSessionId && expectedSessionId !== clientSessionId) {
            // Concurrent session detected: user logged in on another device
            const loginUrl = new URL('/login?reason=concurrent_session', request.url)
            const response = NextResponse.redirect(loginUrl)
            response.cookies.delete('tf_session_id')
            response.cookies.delete('tramiflow_setup_complete')
            return response
        }
    }

    // 3. Redirect Logged-in users away from Login
    if (user && pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 4. Organization Check (Only for protected dashboard routes)
    if (user && !isPublicRoute && !pathname.startsWith('/onboarding')) {
        const { data: organizations } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)

        const hasOrganization = organizations && organizations.length > 0

        if (hasOrganization) {
            supabaseResponse.cookies.set('tramiflow_setup_complete', 'true', {
                maxAge: 31536000, // 1 year
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            })
            return supabaseResponse
        } else {
            const onboardingUrl = new URL('/onboarding', request.url)
            return NextResponse.redirect(onboardingUrl)
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Public files with extensions
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
