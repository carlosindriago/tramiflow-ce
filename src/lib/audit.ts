import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type AuditAction = 
    | 'DOCUMENT_DOWNLOADED' 
    | 'DOCUMENT_DELETED'
    | 'PROCEDURE_CREATED'
    | 'PROCEDURE_DELETED'
    | 'PROCEDURE_STATUS_UPDATED'
    | 'TEMPLATE_CREATED'
    | 'TEMPLATE_ARCHIVED'
    | 'TEMPLATE_UPDATED'
    | 'CLIENT_CREATED'
    | 'CLIENT_DELETED'
    | 'USER_INVITED'
    | 'USER_REMOVED'
    | 'MFA_ENABLED'
    | 'MFA_DISABLED'

export async function logAudit(
    organization_id: string,
    action: AuditAction,
    resource_id?: string,
    resource_type?: string,
    details?: Record<string, unknown>
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        // Get IP Address
        const headersList = await headers()
        const forwardedFor = headersList.get('x-forwarded-for')
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

        // We use the service role key to insert, bypassing RLS to ensure we can always log
        // even if the user role restrictions apply, but since we are inserting, we need an admin client.
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const { error } = await supabaseAdmin
            .from('audit_logs')
            .insert({
                organization_id,
                user_id: user.id,
                action,
                resource_id,
                resource_type,
                details: details || {},
                ip_address: ip
            })

        if (error) {
            console.error('Audit Log Error:', error)
        }
    } catch (e) {
        console.error('Failed to log audit event:', e)
    }
}
