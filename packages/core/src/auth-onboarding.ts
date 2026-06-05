import { redirect } from 'next/navigation'
import { createClient } from '@tramiflow/database/server'
import type { UserOrganization } from '@tramiflow/core'

/**
 * Checks if the current user has completed onboarding (has at least one organization).
 * Redirects to /onboarding if no organizations found.
 *
 * IMPORTANT: This function does NOT redirect to /login.
 * Authentication is handled by Next.js middleware.
 *
 * Usage: Call this in server components or layouts that require an organization.
 *
 * @returns {UserOrganization[]} The user's organizations if found
 * @throws {redirect} Redirects to /onboarding if no organizations
 */
export async function requireOnboarding(): Promise<UserOrganization[]> {
    const supabase = await createClient()

    // Get current user
    let user
    try {
        const result = await supabase.auth.getUser()
        user = result.data?.user
    } catch (error) {
        console.error('[requireOnboarding] Error getting user from auth:', error)
        // If we can't get user, return empty - let middleware handle auth
        return []
    }

    // No user? Return empty and let middleware redirect to login
    if (!user) {
        return []
    }

    // Check if user has organizations
    const { data: organizations, error: orgError } = await supabase
        .rpc('get_user_organizations')

    if (orgError) {
        console.error('[requireOnboarding] Error checking user organizations:', orgError)
        // On error, redirect to onboarding to be safe
        redirect('/onboarding')
    }

    // No organizations found - redirect to onboarding
    if (!organizations || organizations.length === 0) {
        redirect('/onboarding')
    }

    return organizations as UserOrganization[]
}

/**
 * Checks if the current user has completed onboarding.
 * Returns true/false without redirecting.
 *
 * Usage: When you need to conditionally render UI based on onboarding status.
 *
 * @returns {boolean} True if user has organizations, false otherwise
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
    const supabase = await createClient()

    let user
    try {
        const result = await supabase.auth.getUser()
        user = result.data?.user
    } catch (error) {
        console.error('Error checking auth status:', error)
        return false
    }

    if (!user) {
        return false
    }

    const { data: organizations, error } = await supabase.rpc('get_user_organizations')

    if (error) {
        console.error('Error checking onboarding status:', error)
        return false
    }

    return organizations !== null && organizations.length > 0
}
