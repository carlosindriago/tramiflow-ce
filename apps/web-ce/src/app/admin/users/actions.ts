'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { requireSuperAdmin } from '@tramiflow/core'
import { revalidatePath } from 'next/cache'

const getSupabaseAdmin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function fixUserOrganization(userId: string) {
    try {
        await requireSuperAdmin()

        // 1. Get the user's email
        const { data: { user }, error: userError } = await getSupabaseAdmin().auth.admin.getUserById(userId)
        if (userError || !user) throw new Error('User not found in Auth')

        // 2. Create an organization for them
        const orgName = `Org de ${user.email}`
        const slug = `org-${userId.substring(0, 8)}`

        let orgId = ''

        // Check if an orphaned org already exists from a previous failed attempt
        const { data: existingOrg } = await getSupabaseAdmin()
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single()

        if (existingOrg) {
            orgId = existingOrg.id
        } else {
            // Let's create the org using admin client
            const { data: org, error: orgError } = await getSupabaseAdmin()
                .from('organizations')
                .insert({
                    name: orgName,
                    slug,
                    created_by: userId
                })
                .select()
                .single()

            if (orgError) throw orgError
            orgId = org.id
        }

        // 3. Add user as owner in organization_members
        // We do an upsert to prevent unique constraint violations on user_id + org_id
        const { error: memberError } = await getSupabaseAdmin()
            .from('organization_members')
            .upsert({
                organization_id: orgId,
                user_id: userId,
                role: 'OWNER'
            }, { onConflict: 'organization_id,user_id' })

        if (memberError) throw memberError

        // 4. Update the profile
        const { error: profileError } = await getSupabaseAdmin()
            .from('profiles')
            .update({ organization_id: orgId })
            .eq('id', userId)

        if (profileError) throw profileError

        revalidatePath('/admin/users')
        return { success: true, message: 'Organización creada y vinculada correctamente.' }
/* eslint-disable */
    } catch (error: any) {
        console.error('[fixUserOrganization] Falló:', error)
        return { success: false, error: error.message || 'Error desconocido' }
    }
}

export async function toggleUserBan(userId: string, shouldBan: boolean) {
    try {
        await requireSuperAdmin()

        const { error } = await getSupabaseAdmin().auth.admin.updateUserById(userId, {
            ban_duration: shouldBan ? '876000h' : 'none',
        })

        if (error) throw error

        revalidatePath('/admin/users')
        return { success: true, message: shouldBan ? 'Usuario baneado permanentemente.' : 'Usuario desbaneado.' }
/* eslint-disable */
    } catch (error: any) {
        console.error('[toggleUserBan] Falló:', error)
        return { success: false, error: error.message || 'Error desconocido' }
    }
}

export async function deleteUserFully(userId: string) {
    try {
        await requireSuperAdmin()

        // Important: Deleting a user from auth.users might fail if there are foreign keys 
        // lacking ON DELETE CASCADE (e.g., profiles, organizations owned by them).
        // A robust system would clean those up first or ensure cascades exist in the schema.

        // Given the prompt, we proceed with the delete command, handling the error gracefully.
        const { error } = await getSupabaseAdmin().auth.admin.deleteUser(userId)

        if (error) {
            // Check if it's a foreign key violation
            if (error.message.includes('foreign key constraint')) {
                throw new Error('No se puede eliminar: El usuario tiene registros vinculados (clientes, trámites, orgs) que previenen el borrado. Deben eliminarse manualmente primero.')
            }
            throw error
        }

        revalidatePath('/admin/users')
        return { success: true, message: 'Usuario y sus datos eliminados irremediablemente.' }
/* eslint-disable */
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
