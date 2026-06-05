/**
 * TramiFlow CRM - Application Constants
 *
 * Centralized constants for:
 * - Routes
 * - Rate limiting
 * - Timeouts
 * - Toast durations
 */

// ==========================================
// Routes
// ==========================================
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    AUTH_CALLBACK: '/auth/callback',

    // Templates
    TEMPLATES: '/templates',
    TEMPLATE_NEW: '/templates/new',
    TEMPLATE_DETAIL: (id: string) => `/templates/${id}`,
    TEMPLATE_EDIT: (id: string) => `/templates/${id}/edit`,

    // Shared/Public
    SHARED_TEMPLATE: (id: string) => `/shared/templates/${id}`,

    // Dashboard (future)
    CLIENTS: '/clients',
    SETTINGS: '/settings',
    PROFILE: '/profile',
} as const

// ==========================================
// Rate Limits (requests per window)
// ==========================================
export const RATE_LIMITS = {
    // View tracking: 10 requests per minute
    VIEW_TRACKING: { limit: 10, window: 60 },

    // Lead submission: 5 requests per minute
    LEAD_SUBMISSION: { limit: 5, window: 60 },

    // Auth attempts: 5 attempts per 5 minutes
    AUTH_ATTEMPTS: { limit: 5, window: 300 },

    // API requests: 100 requests per minute
    API_REQUESTS: { limit: 100, window: 60 },
} as const

// ==========================================
// Toast Durations (milliseconds)
// ==========================================
export const TOAST_DURATION = {
    SHORT: 2000,
    DEFAULT: 4000,
    LONG: 6000,
} as const

// ==========================================
// Pagination
// ==========================================
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const

// ==========================================
// Template Categories
// ==========================================
export const TEMPLATE_CATEGORIES = {
    RESIDENCIA: 'residencia',
    FAMILIAR: 'familiar',
    ESTUDIANTE: 'estudiante',
    TURISTA: 'turista',
} as const

export const TEMPLATE_CATEGORY_LABELS = {
    [TEMPLATE_CATEGORIES.RESIDENCIA]: 'Residente Trabajador',
    [TEMPLATE_CATEGORIES.FAMILIAR]: 'Reunificación Familiar',
    [TEMPLATE_CATEGORIES.ESTUDIANTE]: 'Visa Estudiante',
    [TEMPLATE_CATEGORIES.TURISTA]: 'Visa Turista',
} as const

// ==========================================
// User Roles
// ==========================================
export const USER_ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
} as const

export const USER_ROLE_LABELS = {
    [USER_ROLES.OWNER]: 'Dueño',
    [USER_ROLES.ADMIN]: 'Administrador',
    [USER_ROLES.MEMBER]: 'Miembro',
} as const

// ==========================================
// Validation Rules
// ==========================================
export const VALIDATION = {
    // Template
    TEMPLATE_NAME_MIN: 2,
    TEMPLATE_NAME_MAX: 100,
    TEMPLATE_DESCRIPTION_MAX: 500,

    // Step
    STEP_TITLE_MIN: 2,
    STEP_TITLE_MAX: 100,
    STEP_DESCRIPTION_MAX: 500,

    // Profile
    FULL_NAME_MIN: 2,
    FULL_NAME_MAX: 100,

    // Organization
    ORG_NAME_MIN: 2,
    ORG_NAME_MAX: 100,

    // Lead
    LEAD_NAME_MIN: 2,
    LEAD_NAME_MAX: 100,
    LEAD_PHONE_MIN: 10,
    LEAD_PHONE_MAX: 15,
} as const

// ==========================================
// Date Formats
// ==========================================
export const DATE_FORMATS = {
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
    INPUT: 'YYYY-MM-DD',
    API: 'YYYY-MM-DDTHH:mm:ss',
} as const

// ==========================================
// Currency
// ==========================================
export const CURRENCY = {
    CODE: 'ARS',
    SYMBOL: '$',
    LOCALE: 'es-AR',
} as const

// ==========================================
// App Metadata
// ==========================================
export const APP = {
    NAME: 'TramiFlow CRM',
    DESCRIPTION: 'Gestión de trámites migratorios',
    VERSION: '1.0.0',
} as const

// ==========================================
// Feature Flags (can be overridden by env)
// ==========================================
export const FEATURES = {
    ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false',
    ENABLE_SHARING: process.env.NEXT_PUBLIC_ENABLE_SHARING !== 'false',
    ENABLE_BRANDING: process.env.NEXT_PUBLIC_ENABLE_BRANDING !== 'false',
} as const

// ==========================================
// Social Links (WhatsApp format)
// ==========================================
export const WHATSAPP = {
    BASE_URL: 'https://wa.me/',
    ARGENTINA_CODE: '54',
} as const

/**
 * Format phone number for WhatsApp link
 * Removes all non-digit characters
 */
export function formatPhoneForWhatsApp(phone: string): string {
    return phone.replace(/\D/g, '')
}
