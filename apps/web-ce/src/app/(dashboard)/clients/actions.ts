'use server'

import { createClientSchema, type CreateClientInput, type Client, actionSuccess, actionError } from '@carlosindriago/core'
import { revalidatePath } from 'next/cache'
import { createOrgAction } from '@/lib/action-helpers'

export const getClients = createOrgAction(
    async ({ supabase, orgId }) => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('getClients error:', error)
            return actionError(error.message)
        }

        return actionSuccess((data || []) as Client[])
    }
)

export const createClientAction = createOrgAction(
    async ({ supabase, orgId }, input: CreateClientInput) => {
        const parsed = createClientSchema.safeParse(input)
        if (!parsed.success) {
            return actionError('Validación fallida', parsed.error.flatten().fieldErrors)
        }

        // Check Plan Limits
        const { checkLimit } = await import('@carlosindriago/database/limits')
        const limitStatus = await checkLimit(orgId, 'clients', supabase)

        if (limitStatus.status === 'unverified_blocked') {
            return actionError('UNVERIFIED_BLOCKED')
        }

        if (limitStatus.status === 'blocked') {
            return actionError('Has alcanzado el límite de clientes de tu plan actual.')
        }

        const { lead_id, ...clientData } = parsed.data

        const { data: newClient, error } = await supabase
            .from('clients')
            .insert({
                ...clientData,
                organization_id: orgId,
            })
            .select()
            .single()

        if (error || !newClient) {
            console.error('[createClientAction] Supabase error:', error)
            return actionError(error?.message || 'Error al crear cliente')
        }

        // Update Lead Status if present
        if (lead_id) {
            await supabase
                .from('leads')
                .update({ status: 'converted' })
                .eq('id', lead_id)
                .eq('organization_id', orgId)
        }

        revalidatePath('/clients')
        return actionSuccess(newClient as Client)
    }
)

export const deleteClientAction = createOrgAction(
    async ({ supabase, orgId }, clientId: string) => {
        // Obtener docs del cliente para limpiar storage
        const { data: docs } = await supabase
            .from('documents')
            .select('storage_path')
            .eq('client_id', clientId)
            .eq('organization_id', orgId)

        // Eliminar archivos de storage si existen
        if (docs && docs.length > 0) {
            const paths = docs.map(d => d.storage_path).filter(Boolean)
            if (paths.length > 0) {
                await supabase.storage.from('client-docs').remove(paths)
            }
        }

        // Eliminar documentos del cliente
        await supabase
            .from('documents')
            .delete()
            .eq('client_id', clientId)
            .eq('organization_id', orgId)

        // Eliminar el cliente
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId)
            .eq('organization_id', orgId)

        if (error) {
            return actionError(error.message)
        }

        const { logAudit } = await import('@carlosindriago/core/server')
        await logAudit(orgId, 'CLIENT_DELETED', clientId, 'client')

        revalidatePath('/clients')
        return actionSuccess(undefined)
    }
)
