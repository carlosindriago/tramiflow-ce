// Admin RBAC types
export type AdminRole = 'super_admin' | 'support' | 'analyst'

export interface AppAdmin {
    user_id: string
    role: AdminRole
    created_at: string
    // Joined from profiles/auth
    email?: string
    full_name?: string
}

// Extended org view for admin panel
export interface OrgAdminView {
    id: string
    name: string
    slug: string | null
    plan_tier: 'free' | 'pro'
    status: 'active' | 'trialing' | 'past_due' | 'canceled'
    trial_ends_at: string | null
    subscription_ends_at: string | null
    created_at: string | null
    // From join
    owner_email?: string
    owner_name?: string
    member_count?: number
}

// Plan action schemas (using zod in server actions)
export type AdminActionResult =
    | { success: true; message: string }
    | { success: false; error: string }
