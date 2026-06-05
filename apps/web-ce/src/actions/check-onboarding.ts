'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@tramiflow/database/server'
import type { UserOrganization } from '@tramiflow/core'

/**
 * Server action to check if user has completed onboarding.
 *
 * Returns the user's organizations or redirects to /onboarding if needed.
 */
export async function checkOnboardingAction(): Promise<UserOrganization[] | null> {
    const supabase = await createClient()

    // Check if user has organizations directly
    // The RPC function handles auth check internally via RLS policies
    let organizations: UserOrganization[] | null = null

    try {
        const result = await supabase.rpc('get_user_organizations')

        if (result.error) {
            // Function might not exist yet (migrations not executed)
            // or other RPC error - log but don't crash
            console.error('RPC error checking organizations:', result.error)

            // If it's a "function not found" error, user needs onboarding
            if (result.error.message?.includes('function not found')) {
                redirect('/onboarding')
            }

            return null
        }

        organizations = result.data as UserOrganization[]
    } catch (error) {
        console.error('Unexpected error checking organizations:', error)
        return null
    }

    // No organizations found - redirect to onboarding
    if (!organizations || organizations.length === 0) {
        redirect('/onboarding')
    }

    // Keep a server-issued cookie as a hint only. It must never be readable or
    // writable from client-side JavaScript.
    const cookieStore = await cookies()
    cookieStore.set('tramiflow_setup_complete', 'true', {
        maxAge: 31536000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    })

    return organizations
}
