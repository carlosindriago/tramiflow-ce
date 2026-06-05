'use server'

import { createClient } from '@tramiflow/database/server'

export type AdminRole = 'super_admin' | 'support' | 'analyst'

export async function requireSuperAdmin(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: admin, error } = await supabase
    .from('app_admins')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (error || !admin || admin.role !== 'super_admin') {
    throw new Error('Forbidden: requires super_admin role')
  }

  return user.id
}

export async function requireAdmin(minRole: AdminRole = 'support'): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: admin } = await supabase
    .from('app_admins')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!admin) {
    throw new Error('Forbidden: not an admin')
  }

  const roleHierarchy: Record<AdminRole, number> = {
    super_admin: 3,
    support: 2,
    analyst: 1
  }

  const adminRole = admin.role as AdminRole
  if (roleHierarchy[adminRole] < roleHierarchy[minRole]) {
    throw new Error(`Forbidden: requires ${minRole} role`)
  }

  return user.id
}

export async function isSuperAdmin(): Promise<boolean> {
  try {
    await requireSuperAdmin()
    return true
  } catch {
    return false
  }
}