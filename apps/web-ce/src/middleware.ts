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

    // 3. User verification and Zero-Latency Check
    const { data: { user } } = await supabase.auth.getUser()

    // Public routes that don't depend on auth
    const { pathname } = request.nextUrl
    const publicRoutes = ['/login', '/auth/callback', '/shared', '/u/', '/templates/share', '/terms', '/privacy', '/help']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // 3.1. Auth Enforcement
    if (!user && !isPublicRoute) {
        // Security: Ensure setup cookie is cleared if session is invalid
        if (request.cookies.has('tramiflow_setup_complete')) {
            supabaseResponse.cookies.delete('tramiflow_setup_complete')
        }

        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // 3.2. Redirect Logged-in users away from Login
    if (user && pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 3.3. Organization Check (Only for protected routes)
    // IMPORTANT: /admin routes bypass org check — admins may not belong to any org
    if (user && !isPublicRoute && !pathname.startsWith('/onboarding') && !pathname.startsWith('/admin')) {
        // SECURITY: never trust a client-controlled cookie as proof that onboarding
        // was completed. Always validate the membership in the database.
        const { data: organizations } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)

        const hasOrganization = organizations && organizations.length > 0

        if (hasOrganization) {
            // Keep the cookie only as a server-issued hint for future optimizations.
            supabaseResponse.cookies.set('tramiflow_setup_complete', 'true', {
                maxAge: 31536000, // 1 year
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            })
            return supabaseResponse
        } else {
            // BLOCK: User has NO org, must onboard
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
