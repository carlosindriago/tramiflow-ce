'use client'

/* eslint-disable */
import { useCallback } from 'react'
/* eslint-disable */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AdminRole } from '@/types/admin'

interface AdminRoleState {
    role: AdminRole | null
    isSuperAdmin: boolean
    isSupport: boolean
    isAnalyst: boolean
    isAdmin: boolean,
    isLoading: boolean
}

async function fetchAdminRole(): Promise<AdminRole | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('app_admins')
        .select('role')
        .eq('user_id', user.id)
        .single()

    return data?.role ?? null
}

export function useAdminRole(): AdminRoleState {
    const { data: role, isLoading } = useQuery({
        queryKey: ['admin-role'],
        queryFn: fetchAdminRole,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    })

    return {
        role: role ?? null,
        isSuperAdmin: role === 'super_admin',
        isSupport: role === 'support',
        isAnalyst: role === 'analyst',
        isAdmin: role !== null,
        isLoading,
    }
}
