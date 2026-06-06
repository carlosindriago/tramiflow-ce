'use server'

import { createClient } from '@carlosindriago/database/server'
/* eslint-disable */
import { type AuditAction } from '@carlosindriago/core/server'

export interface AuditLog {
    id: string
    organization_id: string
    user_id: string
    action: string
    resource_id: string | null
    resource_type: string | null
/* eslint-disable */
    details: any
    ip_address: string | null
    created_at: string
    user?: {
        full_name: string
        email: string
    }
}

export interface GetAuditLogsParams {
    page?: number
    pageSize?: number
    action?: string
    userId?: string
    search?: string
}

export async function getAuditLogsAction(params: GetAuditLogsParams = {}) {
    const { page = 1, pageSize = 20, action, userId, search } = params
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    // 2. Permission check (Owner/Admin only)
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single()

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
        return { success: false, error: 'No tienes permisos para ver estos registros' }
    }

    // 3. Fetch Logs with Join to Profiles
    let query = supabase
        .from('audit_logs')
        .select(`
            *,
            user:profiles(full_name, email)
        `, { count: 'exact' })
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false })

    // Apply filters
    if (action && action !== 'all') {
        query = query.eq('action', action)
    }
    if (userId && userId !== 'all') {
        query = query.eq('user_id', userId)
    }
    // Search in details or action (basic)
    if (search) {
        query = query.or(`action.ilike.%${search}%,ip_address.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
        console.error('Fetch audit logs error:', error)
        return { success: false, error: error.message }
    }

    return {
        success: true,
        data: data as unknown as AuditLog[],
        count: count || 0,
        page,
        pageSize
    }
}

export async function getAuditUsersAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return []

    const { data } = await supabase
        .from('organization_members')
        .select('profiles(id, full_name, email)')
        .eq('organization_id', member.organization_id)

    return data?.map(m => m.profiles).filter(Boolean) || []
}
