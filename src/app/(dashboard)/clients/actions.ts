'use server'

import { createClient } from '@/lib/supabase/server'
import { createClientSchema, type CreateClientInput, type Client, type ClientActionResult, type ClientActionError } from '@/types/client'
import { revalidatePath } from 'next/cache'

export async function getClients(): Promise<Client[]> {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get Org to filter clients
    const { data: member } = await supabase.from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!member?.organization_id) return []

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

export async function createClientAction(input: CreateClientInput): Promise<ClientActionResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Validación Zod (doble check aunque viene tipado)
    const parsed = createClientSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors as ClientActionError['error'] }
    }

    // Obtener organization_id del member
    const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (memberError) {
        console.error('[createClientAction] Error fetching organization_members:', memberError)
        return { error: { _form: ['Error al verificar organización. Por favor contacta soporte.'] } }
    }

    if (!member?.organization_id) {
        return { error: { _form: ['Usuario sin organización. Por favor contacta soporte.'] } }
    }

    const organization_id = member.organization_id

    // Check Plan Limits
    const { checkLimit } = await import('@/lib/limits')
    const limitStatus = await checkLimit(organization_id, 'clients', supabase)

    if (limitStatus.status === 'unverified_blocked') {
        return { error: { _form: ['UNVERIFIED_BLOCKED'] } }
    }

    if (limitStatus.status === 'blocked') {
        return { error: { _form: ['Has alcanzado el límite de clientes de tu plan actual.'] } }
    }

    // Extract lead_id to not insert it into clients table
    const { lead_id, ...clientData } = parsed.data

    // Debug: Log what we're inserting
    console.log('[createClientAction] Inserting:', { ...clientData, organization_id })

    const { error } = await supabase.from('clients').insert({
        ...clientData,
        organization_id: organization_id,
    })

    if (error) {
        console.error('[createClientAction] Supabase error:', error)
        return { error: { _form: [error.message] } }
    }

    // Update Lead Status if present
    if (lead_id) {
        await supabase.from('leads')
            .update({ status: 'converted' })
            .eq('id', lead_id)
            .eq('organization_id', organization_id)
    }

    revalidatePath('/clients')
    return { success: true }
}

export async function deleteClientAction(clientId: string): Promise<ClientActionResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (!member?.organization_id) throw new Error('No organization')

    // Obtener docs del cliente para limpiar storage
    const { data: docs } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('client_id', clientId)

    // Eliminar archivos de storage si existen
    if (docs && docs.length > 0) {
        const paths = docs.map(d => d.storage_path).filter(Boolean)
        if (paths.length > 0) {
            await supabase.storage.from('client-docs').remove(paths)
        }
    }

    // Eliminar documentos del cliente
    await supabase.from('documents').delete().eq('client_id', clientId)

    // Eliminar el cliente
    const { error } = await supabase.from('clients').delete().eq('id', clientId)

    if (error) return { error: { _form: [error.message] } }

    const { logAudit } = await import('@/lib/audit')
    await logAudit(member.organization_id, 'CLIENT_DELETED', clientId, 'client')

    revalidatePath('/clients')
    return { success: true }
}
