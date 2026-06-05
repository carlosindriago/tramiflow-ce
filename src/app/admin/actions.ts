'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireSuperAdmin } from '@/lib/admin-permissions'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AdminActionResult, AdminRole } from '@/types/admin'

// ─── Organization Plan Actions ────────────────────────────────────────────────

const orgIdSchema = z.string().uuid()

export async function activatePro(orgId: string): Promise<AdminActionResult> {
    try {
        await requireAdmin('super_admin')
        orgIdSchema.parse(orgId)

        const supabase = await createClient()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        const { error } = await supabase
            .from('organizations')
            .update({
                plan_tier: 'pro',
                status: 'active',
                subscription_ends_at: expiresAt.toISOString(),
            })
            .eq('id', orgId)

        if (error) throw error

        revalidatePath('/admin/orgs')
        return { success: true, message: 'Plan PRO activado por 30 días.' }
    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}

export async function extendTrial(orgId: string): Promise<AdminActionResult> {
    try {
        // Support can extend trial, so we only require any admin role
        await requireAdmin()
        orgIdSchema.parse(orgId)

        const supabase = await createClient()

        // Get current trial_ends_at
        const { data: org, error: fetchError } = await supabase
            .from('organizations')
            .select('trial_ends_at')
            .eq('id', orgId)
            .single()

        if (fetchError || !org) throw new Error('Organization not found')

        const currentEnd = org.trial_ends_at ? new Date(org.trial_ends_at) : new Date()
        // If already expired, extend from now
        const base = currentEnd < new Date() ? new Date() : currentEnd
        base.setDate(base.getDate() + 7)

        const { error } = await supabase
            .from('organizations')
            .update({ trial_ends_at: base.toISOString(), status: 'trialing' })
            .eq('id', orgId)

        if (error) throw error

        revalidatePath('/admin/orgs')
        return { success: true, message: 'Trial extendido 7 días.' }
    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}

export async function banOrganization(orgId: string): Promise<AdminActionResult> {
    try {
        await requireAdmin('super_admin')
        orgIdSchema.parse(orgId)

        const supabase = await createClient()
        const { error } = await supabase
            .from('organizations')
            .update({ status: 'canceled' })
            .eq('id', orgId)

        if (error) throw error

        revalidatePath('/admin/orgs')
        return { success: true, message: 'Organización bloqueada.' }
    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}

export async function downgradeToFree(orgId: string): Promise<AdminActionResult> {
    try {
        await requireAdmin('super_admin')
        orgIdSchema.parse(orgId)

        const supabase = await createClient()
        const { error } = await supabase
            .from('organizations')
            .update({
                plan_tier: 'free',
                status: 'active',
                subscription_ends_at: null,
            })
            .eq('id', orgId)

        if (error) throw error

        revalidatePath('/admin/orgs')
        return { success: true, message: 'Degradado a plan Free.' }
    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}

// ─── Team Admin Actions ───────────────────────────────────────────────────────

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['super_admin', 'support', 'analyst']),
})

export async function inviteAdmin(
  email: string,
  role: AdminRole
): Promise<AdminActionResult> {
  try {
    await requireAdmin('super_admin')
    inviteSchema.parse({ email, role })

    return {
      success: false,
      error: 'Para invitar admins, usá insertAdminByUserId() con el UUID del usuario. Ver instrucciones en /admin/settings/team.',
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function insertAdminByUserId(
    userId: string,
    role: AdminRole
): Promise<AdminActionResult> {
    try {
        await requireAdmin('super_admin')
        z.string().uuid().parse(userId)

        const supabase = await createClient()
        const { error } = await supabase
            .from('app_admins')
            .insert({ user_id: userId, role })

        if (error) throw error

        revalidatePath('/admin/settings/team')
        return { success: true, message: `Admin ${role} añadido correctamente.` }
    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}

export async function removeAdmin(userId: string): Promise<AdminActionResult> {
    try {
        await requireAdmin('super_admin')

        const supabase = await createClient()
        // Prevent self-removal
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id === userId) {
            return { success: false, error: 'No puedes eliminarte a ti mismo.' }
        }

        const { error } = await supabase
            .from('app_admins')
            .delete()
            .eq('user_id', userId)

        if (error) throw error

        revalidatePath('/admin/settings/team')
        return { success: true, message: 'Admin eliminado.' }
    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}

export async function fixMissingProfile(userId: string): Promise<AdminActionResult> {
    try {
        await requireAdmin() // Any admin can fix profiles

        const supabase = await createClient()
        const { error } = await supabase.rpc('admin_fix_missing_profile', {
            target_user_id: userId,
        })

        if (error) throw error

        revalidatePath('/admin/users')
        return { success: true, message: 'Perfil restaurado correctamente.' }
    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}

// ─── Payment Actions ──────────────────────────────────────────────────────────

const verifyPaymentSchema = z.object({
    reportId: z.string().uuid(),
    status: z.enum(['approved', 'rejected']),
    note: z.string().optional(),
})

export async function verifyPayment(reportId: string, status: 'approved' | 'rejected', note?: string): Promise<AdminActionResult> {
    try {
        await requireAdmin('super_admin') // Only super admins can approve payments/activate PRO
        verifyPaymentSchema.parse({ reportId, status, note })

        const supabase = await createClient()

        // 1. Get Report & User
        const { data: report, error: fetchError } = await supabase
            .from('payment_reports')
            .select('organization_id, amount, currency, organization:organizations(name)')
            .eq('id', reportId)
            .single()

        if (fetchError || !report) throw new Error('Reporte no encontrado')

        // 2. Update Status
        const { error: updateError } = await supabase
            .from('payment_reports')
            .update({
                status,
                admin_note: note,
                updated_at: new Date().toISOString()
            })
            .eq('id', reportId)

        if (updateError) throw updateError

        // 3. Logic based on status
        if (status === 'approved') {
            // Activate PRO logic (duplicated from activatePro to avoid double auth check or circular deps)
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 30)

            await supabase
                .from('organizations')
                .update({
                    plan_tier: 'pro',
                    status: 'active',
                    subscription_ends_at: expiresAt.toISOString(),
                })
                .eq('id', report.organization_id)

            // Stub email
            console.log(`[EMAIL] To Org ${report.organization_id}: Pago aprobado. Eres PRO.`)
        } else {
            console.log(`[EMAIL] To Org ${report.organization_id}: Pago rechazado. Motivo: ${note}`)
        }

        revalidatePath('/admin/payments')
        return { success: true, message: `Pago ${status === 'approved' ? 'aprobado' : 'rechazado'} correctamente.` }
    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}

export async function updatePaymentConfig(config: any): Promise<AdminActionResult> {
    try {
        await requireAdmin('super_admin')

        // Basic validation (can be improved with Zod schema for specific fields)
        if (!config || typeof config !== 'object') {
            throw new Error('Configuración inválida')
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key: 'payment_config',
                value: config,
                updated_at: new Date().toISOString(),
                updated_by: user?.id
            })

        if (error) throw error

        revalidatePath('/admin/payments')
        revalidatePath('/settings/billing') // Update client view
        return { success: true, message: 'Configuración de pagos actualizada.' }

    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}
