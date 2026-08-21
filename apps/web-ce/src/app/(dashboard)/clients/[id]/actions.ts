'use server'

import { type Client } from '@carlosindriago/core'
import { type Document } from '@carlosindriago/core'
import { actionSuccess, actionError } from '@carlosindriago/core'
import { createOrgAction } from '@/lib/action-helpers'

export const getClientById = createOrgAction(
    async ({ supabase, orgId }, id: string) => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single()

        if (error || !data) {
            console.error('getClientById Error:', error)
            return actionError(error?.message || 'Cliente no encontrado')
        }

        return actionSuccess(data as Client)
    }
)

export const getClientDocuments = createOrgAction(
    async ({ supabase, orgId }, clientId: string) => {
        const { data: docs, error } = await supabase
            .from('documents')
            .select('*')
            .eq('client_id', clientId)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('getClientDocuments Error:', error)
            return actionError(error.message)
        }

        if (!docs || docs.length === 0) {
            return actionSuccess([] as Document[])
        }

        // Generate signed URLs for all documents
        const { data: signedUrls, error: signedUrlError } = await supabase
            .storage
            .from('client-docs')
            .createSignedUrls(
                docs.map(d => d.storage_path),
                60 * 60 // 1 hour expiry
            )

        if (signedUrlError) {
            console.error('Error generating signed URLs:', signedUrlError)
            return actionSuccess(docs as unknown as Document[])
        }

        // Map signed URLs to documents
        const documentsWithUrls = docs.map((doc, index) => ({
            ...doc,
            url: signedUrls?.[index]?.signedUrl || '',
        }))

        return actionSuccess(documentsWithUrls as Document[])
    }
)

export const getClientProcedures = createOrgAction(
    async ({ supabase, orgId }, clientId: string) => {
        const { data, error } = await supabase
            .from('procedures')
            .select(`
                *,
                template:procedure_templates(
                    id,
                    name,
                    requirements,
                    steps,
                    fees_professional:fees,
                    fees_official:government_fee
                )
            `)
            .eq('client_id', clientId)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('getClientProcedures Error:', error)
            return actionError(error.message)
        }

        return actionSuccess(data ?? [])
    }
)
