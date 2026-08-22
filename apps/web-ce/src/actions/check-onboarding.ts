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

        const { data: members, error: memberError } = await supabase
            .from('organization_members')
            .select(`
                role,
                organization:organizations(
                    id,
                    name,
                    slug,
                    logo_url,
                    plan
                )
            `)
            .eq('user_id', user.id)

        if (memberError || !members || members.length === 0) {
            return null
        }

        interface MemberOrgItem {
            role: string | null
            organization: {
                id: string
                name: string
                slug: string | null
                logo_url: string | null
                plan: string | null
            } | null
        }

        const rawMembers = members as unknown as MemberOrgItem[]
        const organizations: UserOrganization[] = rawMembers
            .filter((m) => m.organization !== null)
            .map((m) => ({
                id: m.organization!.id,
                name: m.organization!.name,
                slug: m.organization!.slug || '',
                logo_url: m.organization!.logo_url || null,
                plan: (m.organization!.plan === 'pro' || m.organization!.plan === 'enterprise') ? m.organization!.plan : 'free',
                role: (m.role?.toLowerCase() === 'owner' || m.role?.toLowerCase() === 'admin') ? m.role.toLowerCase() as 'owner' | 'admin' : 'member',
            }))

        if (organizations.length === 0) {
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
