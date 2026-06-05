import { z } from 'zod'

// Organization plans
export const ORGANIZATION_PLANS = {
    free: { label: 'Free', limits: { users: 1, storage: 100 } },
    pro: { label: 'Pro', limits: { users: 5, storage: 1000 } },
    enterprise: { label: 'Enterprise', limits: { users: -1, storage: -1 } },
} as const

export type OrganizationPlan = keyof typeof ORGANIZATION_PLANS

// Organization roles
export const ORGANIZATION_ROLES = {
    owner: { label: 'Dueño', permissions: ['all'] },
    admin: { label: 'Administrador', permissions: ['manage', 'invite'] },
    member: { label: 'Miembro', permissions: ['view'] },
} as const

export type OrganizationRole = keyof typeof ORGANIZATION_ROLES

// Core organization type
export interface Organization {
    id: string
    name: string
    slug: string
    logo_url: string | null
    plan: OrganizationPlan
    plan_code: string
    plan_tier: 'free' | 'pro'
    status: 'active' | 'trialing' | 'past_due' | 'canceled'
    trial_ends_at: string | null
    subscription_ends_at: string | null
    public_settings: {
        theme?: 'modern_light' | 'dark_elegance' | 'navy_pro'
        headline?: string
        subheadline?: string
        primary_color?: string
        cta_text?: string
        show_prices?: boolean
    } | null
    created_at: string
    created_by: string
}

// Organization membership
export interface OrganizationMember {
    id: string
    organization_id: string
    user_id: string
    role: OrganizationRole
    created_at: string
}

// Organization with user's role (from join query)
export interface UserOrganization {
    id: string
    name: string
    slug: string
    logo_url: string | null
    plan: OrganizationPlan
    role: OrganizationRole
}

export const onboardingSchema = z.object({
    // Step 1: User Profile
    full_name: z
        .string()
        .min(3, 'El nombre completo debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    phone: z
        .string()
        .min(5, 'Ingresa un teléfono válido')
        .max(20, 'El teléfono es muy largo'),
    
    // Step 2: Organization
    name: z
        .string()
        .min(3, 'El nombre de la empresa debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .regex(
            /^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑÜü\s-]+$/,
            'Solo se permiten letras, números, espacios y guiones'
        ),
    country: z.string().min(2, 'Ingresa el país'),
    city: z.string().min(2, 'Ingresa la ciudad'),
    whatsapp_contact: z.string().min(5, 'Ingresa un número de WhatsApp válido'),
    logo: z
        .any()
        .optional()
        .refine(
            (file) => !file || file.size <= 2 * 1024 * 1024,
            'El logo no puede exceder 2MB'
        )
        .refine(
            (file) =>
                !file || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
            'Solo se permiten imágenes seguras (JPG, PNG, WebP)'
        ),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>

// Server action result types
export type OnboardingActionError = {
    success?: false
    error: {
        _form?: string[]
        full_name?: string[]
        phone?: string[]
        name?: string[]
        country?: string[]
        city?: string[]
        whatsapp_contact?: string[]
        logo?: string[]
    }
}

export type OnboardingActionResult = OnboardingActionError | { success: true; organizationId: string }
