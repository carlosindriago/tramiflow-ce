import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

// Use public anon key for cached queries (plans are public info)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create service-role client for cached queries (no auth needed)
const getPublicClient = () => 
    createSupabaseClient(supabaseUrl, supabaseAnonKey)

export interface ResourceUsage {
    currentCount: number
    maxLimit: number
    graceLimit: number // maxLimit + grace_allowance
    status: 'ok' | 'warning' | 'grace' | 'blocked' | 'unverified_blocked'
}

type SubscriptionPlan = {
    code: string
    name: string
    max_clients: number
    max_procedures: number
    max_storage_mb: number
    grace_allowance: number
}

// Cached plan definition - uses public client (no cookies)
export const getPlan = unstable_cache(
    async (code: string): Promise<SubscriptionPlan | null> => {
        const supabase = getPublicClient()
        const { data } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('code', code)
            .single()
        return data
    },
    ['subscription_plan'],
    { revalidate: 3600, tags: ['plans'] }
)

export async function checkLimit(
    orgId: string,
    resource: 'clients' | 'procedures' | 'storage',
    supabase: SupabaseClient
): Promise<ResourceUsage> {
    // 1. Get Organization Plan Code and Owner Verification Status
    const { data: org } = await supabase
        .from('organizations')
        .select('plan_code')
        .eq('id', orgId)
        .single()

    const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('organization_id', orgId)
        .eq('role', 'owner')
        .limit(1)
        .single()

    const isVerified = ownerProfile?.email_verified ?? false

    // Default to 'free' plan if no plan_code is assigned
    const planCode = org?.plan_code || 'free'

    // 2. Get Plan Limits (Cached is fine for definitions)
    const plan = await getPlan(planCode)
    if (!plan) {
        // If 'free' plan doesn't exist either, use hardcoded defaults
        console.warn(`Plan '${planCode}' not found, using hardcoded free tier defaults`)
        return getDefaultFreeTierLimits(resource)
    }

    // 3. Count Current Usage (Real-time, NO CACHE)
    let currentCount = 0

    if (resource === 'clients') {
        const { count } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
        currentCount = count ?? 0
    } else if (resource === 'procedures') {
        const { count } = await supabase
            .from('procedures')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
        currentCount = count ?? 0
    } else if (resource === 'storage') {
        // TODO: Implement actual storage counting if we have a table for it
        currentCount = 0
    }

    // 4. Calculate Status
    const baseMaxLimit = resource === 'clients' ? plan.max_clients
        : resource === 'procedures' ? plan.max_procedures
            : plan.max_storage_mb

    // PLG: Limit maxLimit to 50% if email is not verified
    const maxLimit = isVerified ? baseMaxLimit : Math.floor(baseMaxLimit * 0.5)

    // Safety check for unlimited (e.g. -1 or very high number)
    const isUnlimited = maxLimit > 900000

    if (isUnlimited) {
        return {
            currentCount,
            maxLimit,
            graceLimit: maxLimit,
            status: 'ok'
        }
    }

    const graceLimit = maxLimit + plan.grace_allowance

    let status: ResourceUsage['status'] = 'ok'

    if (!isVerified && currentCount >= maxLimit) {
        status = 'unverified_blocked'
    } else if (currentCount >= graceLimit) {
        status = 'blocked'
    } else if (currentCount >= maxLimit) {
        status = 'grace'
    } else if (currentCount >= maxLimit * 0.8) {
        status = 'warning'
    }

    return {
        currentCount,
        maxLimit,
        graceLimit,
        status
    }
}

// Fallback function when plan is not found in database
function getDefaultFreeTierLimits(resource: 'clients' | 'procedures' | 'storage'): ResourceUsage {
    // Free tier hardcoded defaults
    const freeTierDefaults = {
        clients: { max: 10, grace: 15 },
        procedures: { max: 25, grace: 30 },
        storage: { max: 100, grace: 150 } // MB
    }
    
    const limits = freeTierDefaults[resource]
    
    return {
        currentCount: 0,
        maxLimit: limits.max,
        graceLimit: limits.grace,
        status: 'ok'
    }
}
