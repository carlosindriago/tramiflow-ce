'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { requireSuperAdmin } from '@tramiflow/core/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@tramiflow/database/types'

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function getOrgMembers(orgId: string) {
  await requireSuperAdmin()

  const { data: members, error } = await getSupabaseAdmin()
        .from('organization_members')
        .select(`
            id,
            user_id,
            role,
            created_at
        `)
        .eq('organization_id', orgId)

    if (error) {
        console.error('Error fetching org members', error)
        return []
    }

    if (!members || members.length === 0) return []

    const userIds = members.map(m => m.user_id).filter(Boolean)

    const { data: profiles, error: profilesError } = await getSupabaseAdmin()
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)

    if (profilesError) {
        console.error('Error fetching member profiles', profilesError)
    }

    return members.map(member => ({
        id: member.id,
        role: member.role,
        created_at: member.created_at,
        profiles: profiles?.find(p => p.id === member.user_id) || null
    }))
}

// --------------------------------------------------------------------------
// ADVANCED ORG ACTION PANEL SERVER FUNCTIONS
// --------------------------------------------------------------------------

export async function renameOrganization(orgId: string, newName: string) {
    try {
        await requireSuperAdmin()
        if (!newName.trim()) throw new Error('El nombre no puede estar vacío.')

        const { data, error } = await getSupabaseAdmin()
            .from('organizations')
            .update({ name: newName.trim() })
            .eq('id', orgId)
            .select()

        if (error) throw error
        if (!data || data.length === 0) throw new Error('No se encontró la organización para actualizar o no tienes permisos.')

        revalidatePath(`/admin/orgs/${orgId}`)
        revalidatePath('/admin/orgs')
        return { success: true, message: 'Organización renombrada con éxito.' }
/* eslint-disable */
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function setOrgPlan(orgId: string, planTier: 'free' | 'pro') {
    try {
        await requireSuperAdmin()

        const { error } = await getSupabaseAdmin()
            .from('organizations')
            .update({ plan_tier: planTier, plan_code: `admin_forced_${planTier}` })
            .eq('id', orgId)

        if (error) throw error

        revalidatePath(`/admin/orgs/${orgId}`)
        return { success: true, message: `Plan actualizado a ${planTier.toUpperCase()}.` }
/* eslint-disable */
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function extendOrgPlan(orgId: string, extensionDays: number) {
    try {
        await requireSuperAdmin()
        if (extensionDays <= 0) throw new Error('Los días deben ser mayores a 0.')

        // Check current subscription_ends_at
        const { data: org, error: fetchError } = await getSupabaseAdmin()
            .from('organizations')
            .select('subscription_ends_at')
            .eq('id', orgId)
            .single()

        if (fetchError || !org) throw new Error('No se pudo cargar la organización.')

        // Calculate new date
        const baseDate = org.subscription_ends_at && new Date(org.subscription_ends_at) > new Date()
            ? new Date(org.subscription_ends_at)
            : new Date()

        baseDate.setDate(baseDate.getDate() + extensionDays)
        const newEndsAt = baseDate.toISOString()

        const { error } = await getSupabaseAdmin()
            .from('organizations')
            .update({
                subscription_ends_at: newEndsAt,
                status: 'active'
            })
            .eq('id', orgId)

        if (error) throw error

        revalidatePath(`/admin/orgs/${orgId}`)
        return { success: true, message: `Suscripción extendida por ${extensionDays} días.` }
/* eslint-disable */
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function manualRegisterPayment(orgId: string, amount: number, operationNumber: string) {
    try {
        await requireSuperAdmin()
        if (amount <= 0) throw new Error('El monto debe ser mayor a 0.')
        if (!operationNumber.trim()) throw new Error('El número de operación es requerido.')

        // Provide fallback currency
        const { error } = await getSupabaseAdmin()
            .from('payment_reports')
            .insert({
                organization_id: orgId,
                amount: amount,
                currency: 'USD',
                operation_number: operationNumber.trim(),
                status: 'approved',
                admin_note: 'Manual SuperAdmin Registration',
                payment_method_id: 'manual',
                proof_url: 'MANUAL_ADMIN_ENTRY'
            })

        if (error) throw error

        revalidatePath(`/admin/orgs/${orgId}`)
        return { success: true, message: 'Pago registrado y aprobado guardado.' }
/* eslint-disable */
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function banOrganization(orgId: string) {
    try {
        await requireSuperAdmin()

        // 1. Mark Organization as Canceled
        const { error: orgError } = await getSupabaseAdmin()
            .from('organizations')
            .update({ status: 'canceled' })
            .eq('id', orgId)

        if (orgError) throw orgError

        // 2. Fetch all members
        const { data: members, error: memError } = await getSupabaseAdmin()
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', orgId)

        if (memError) throw memError

        // 3. Ban all users via Auth
        if (members && members.length > 0) {
            for (const member of members) {
                if (!member.user_id) continue
                await getSupabaseAdmin().auth.admin.updateUserById(member.user_id, {
                    ban_duration: '876000h' // 100 years
                })
            }
        }

        revalidatePath(`/admin/orgs/${orgId}`)
        return { success: true, message: 'La organización y sus miembros han sido baneados.' }
/* eslint-disable */
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function removeMemberFromOrg(orgId: string, memberId: string) {
    try {
        await requireSuperAdmin()

        const { error } = await getSupabaseAdmin()
            .from('organization_members')
            .delete()
            .eq('id', memberId)
            .eq('organization_id', orgId)

        if (error) throw error

        revalidatePath(`/admin/orgs/${orgId}`)
        return { success: true, message: 'Miembro removido con éxito.' }
/* eslint-disable */
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
