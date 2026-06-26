'use server'

import { createClient } from '@carlosindriago/database/server'
import { checkLimit, type ResourceUsage } from '@carlosindriago/database/limits'

export interface LimitsState {
    clients: ResourceUsage
    procedures: ResourceUsage
    storage: ResourceUsage
    planCode: string
    subscriptionEndsAt?: string | null
    status?: string | null
}

export async function getOrganizationLimits(): Promise<{ success: boolean; data?: LimitsState; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: 'Unauthorized' }

        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id, organization:organizations(plan_code, subscription_ends_at, status)')
            .eq('user_id', user.id)
            .limit(1)
        .single()

        if (!member) return { success: false, error: 'No organization' }

        const orgId = member.organization_id
        const org = member.organization as unknown as { 
            plan_code: string | null; 
            subscription_ends_at: string | null; 
            status: string | null 
        } | null
        const planCode = org?.plan_code || 'free'

        const [clients, procedures, storage] = await Promise.all([
            checkLimit(orgId, 'clients', supabase),
            checkLimit(orgId, 'procedures', supabase),
            checkLimit(orgId, 'storage', supabase)
        ])

        return {
            success: true,
            data: {
                clients,
                procedures,
                storage,
                planCode,
                subscriptionEndsAt: org?.subscription_ends_at,
                status: org?.status
            }
        }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}
