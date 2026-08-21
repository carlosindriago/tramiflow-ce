import { createClient } from '@carlosindriago/database/server'
import type { Database } from '@carlosindriago/database'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { ActionResult, actionError } from '@carlosindriago/core'

export interface OrgActionContext {
    user: User
    orgId: string
    supabase: SupabaseClient<Database>
}

export interface AdminActionContext {
    user: User
    supabase: SupabaseClient<Database>
}

/**
 * Higher-Order Function for Server Actions requiring organization membership.
 * Automatically verifies authentication, resolves the active organization_id,
 * and supplies a typed Supabase client.
 */
export function createOrgAction<TArgs extends unknown[], TReturn>(
    actionFn: (ctx: OrgActionContext, ...args: TArgs) => Promise<ActionResult<TReturn>>
) {
    return async (...args: TArgs): Promise<ActionResult<TReturn>> => {
        try {
            const supabase = await createClient()
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser()

            if (authError || !user) {
                return actionError('No autenticado. Inicia sesión nuevamente.')
            }

            const { data: member, error: memberError } = await supabase
                .from('organization_members')
                .select('organization_id, role')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle()

            if (memberError || !member?.organization_id) {
                return actionError('No se encontró una organización activa vinculada.')
            }

            return await actionFn(
                {
                    user,
                    orgId: member.organization_id,
                    supabase,
                },
                ...args
            )
        } catch (error) {
            console.error('Unhandled action error:', error)
            const message = error instanceof Error ? error.message : 'Error inesperado del servidor'
            return actionError(message)
        }
    }
}

/**
 * Higher-Order Function for Server Actions requiring super_admin privileges.
 */
export function createAdminAction<TArgs extends unknown[], TReturn>(
    actionFn: (ctx: AdminActionContext, ...args: TArgs) => Promise<ActionResult<TReturn>>
) {
    return async (...args: TArgs): Promise<ActionResult<TReturn>> => {
        try {
            const supabase = await createClient()
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser()

            if (authError || !user) {
                return actionError('No autenticado. Inicia sesión nuevamente.')
            }

            const { data: adminData } = await supabase
                .from('app_admins')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle()

            if (!adminData) {
                return actionError('Acceso no autorizado: requiere permisos de administrador.')
            }

            return await actionFn(
                {
                    user,
                    supabase,
                },
                ...args
            )
        } catch (error) {
            console.error('Unhandled admin action error:', error)
            const message = error instanceof Error ? error.message : 'Error inesperado del servidor'
            return actionError(message)
        }
    }
}
