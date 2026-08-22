'use server'

import { cookies } from 'next/headers'
import { createClient } from '@carlosindriago/database/server'
import type { UserOrganization } from '@carlosindriago/core'

/**
 * Server action to check if user has completed onboarding.
 *
 * Returns the user's organizations or null if none/error.
 */
export async function checkOnboardingAction(): Promise<UserOrganization[] | null> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return null
        }

        const result = await supabase.rpc('get_user_organizations')

        if (result.error) {
            console.error('RPC error checking organizations:', result.error)
            return null
        }

        const organizations = result.data as UserOrganization[]

        if (!organizations || organizations.length === 0) {
            return null
        }

        try {
            const cookieStore = await cookies()
            cookieStore.set('tramiflow_setup_complete', 'true', {
                maxAge: 31536000,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            })
        } catch {
            // Ignore cookie set errors in read-only RSC contexts
        }

        return organizations
    } catch (error) {
        console.error('Unexpected error checking organizations:', error)
        return null
    }
}
