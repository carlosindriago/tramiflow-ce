'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { checkOnboardingAction } from '@/actions/check-onboarding'

interface OnboardingGuardProps {
    children: React.ReactNode
}

/**
 * Client component that checks if user has completed onboarding.
 * Redirects to /onboarding if they haven't created an organization yet.
 *
 * This uses the browser Supabase client (more reliable in Next.js 15)
 * and calls a server action to avoid server component auth issues.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isChecked, setIsChecked] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Skip check if already on onboarding page
        if (pathname === '/onboarding') {
            setIsChecked(true)
            setIsLoading(false)
            return
        }

        let mounted = true

        async function checkOnboarding() {
            try {
                const organizations = await checkOnboardingAction()

                if (!organizations || organizations.length === 0) {
                    // Server action will redirect, but we can also force it
                    router.push('/onboarding')
                    return
                }

                // User has organizations - allow access
                setIsChecked(true)
            } catch (error) {
                console.error('Error checking onboarding:', error)
                // On error, allow access but log it
                setIsChecked(true)
            } finally {
                setIsLoading(false)
            }
        }

        checkOnboarding()

        return () => {
            mounted = false
        }
    }, [pathname])

    // Non-blocking check
    if (isLoading) {
        // We trust middleware, but in case we are here and still checking,
        // we just render children. If check fails, we will redirect.
        // This avoids the "flash" of loading screen.
        return <>{children}</>
    }

    // Don't render children until check is complete
    if (!isChecked) {
        return null
    }

    return <>{children}</>
}
