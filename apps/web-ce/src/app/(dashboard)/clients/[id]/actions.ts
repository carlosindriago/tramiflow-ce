'use server'

import { type Client, type Document, actionSuccess, actionError } from '@carlosindriago/core'
import { createOrgAction } from '@/lib/action-helpers'

export async function getClientById(id: string) {
    return createOrgAction(
        async ({ supabase, orgId }, clientId: string) => {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', clientId)
                .eq('organization_id', orgId)
                .maybeSingle()

            if (error || !data) {
                console.error('getClientById Error:', error)
                return actionError(error?.message || 'Cliente no encontrado')
            }

            return actionSuccess(data as Client)
        }
    )(id)
}

export async function getClientDocuments(clientId: string) {
    return createOrgAction(
        async ({ supabase, orgId }, id: string) => {
            const { data: docs, error } = await supabase
                .from('documents')
                .select('*')
                .eq('client_id', id)
                .eq('organization_id', orgId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('getClientDocuments Error:', error)
                return actionError(error.message)
            }

            if (!docs || docs.length === 0) {
                return actionSuccess([] as Document[])
            }

            // Generate signed URLs with 60s ephemeral expiry
            const { data: signedUrls, error: signedUrlError } = await supabase
                .storage
                .from('client-docs')
                .createSignedUrls(
                    docs.map(d => d.storage_path),
                    60 // 60s ephemeral expiry
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
    )(clientId)
}

export async function getDocumentSignedUrlAction(documentId: string) {
    return createOrgAction(
        async ({ supabase, orgId }, docId: string) => {
            const { data: doc, error: docError } = await supabase
                .from('documents')
                .select('storage_path, organization_id')
                .eq('id', docId)
                .eq('organization_id', orgId)
                .maybeSingle()

            if (docError || !doc) {
                return actionError('Documento no encontrado o no autorizado')
            }

            const { data, error } = await supabase.storage
                .from('client-docs')
                .createSignedUrl(doc.storage_path, 60) // 60s ephemeral TTL

            if (error || !data) {
                return actionError(error?.message || 'Error al generar URL firmada')
            }

            return actionSuccess({ signedUrl: data.signedUrl })
        }
    )(documentId)
}

export async function getClientProcedures(clientId: string) {
    return createOrgAction(
        async ({ supabase, orgId }, id: string) => {
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
                .eq('client_id', id)
                .eq('organization_id', orgId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('getClientProcedures Error:', error)
                return actionError(error.message)
            }

            return actionSuccess(data)
        }
    )(clientId)
}
