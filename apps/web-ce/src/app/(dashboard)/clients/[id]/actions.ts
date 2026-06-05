'use server'

import { createClient } from '@tramiflow/database/server'
import { type Client } from '@tramiflow/core'
import { type Document } from '@tramiflow/core'

export async function getClientById(id: string): Promise<Client | null> {
    try {
        console.log('getClientById: Creating client...')
        const supabase = await createClient()
        console.log('getClientById: Client created. Fetching user...')

        // Verify auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('getClientById Auth Error:', authError)
            return null
        }

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('getClientById Error:', error)
            return null
        }

        return data as Client
    } catch (err) {
        console.error('getClientById Unexpected Error:', err)
        return null
    }
}

export async function getClientDocuments(clientId: string): Promise<Document[]> {
    try {
        const supabase = await createClient()

        // Verify auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('getClientDocuments Auth Error:', authError)
            return []
        }

        const { data: docs, error } = await supabase
            .from('documents')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('getClientDocuments Error:', error)
            return []
        }

        if (!docs || docs.length === 0) return []

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
            // Fallback: return docs without URLs (thumbnails won't show)
            return docs as unknown as Document[]
        }

        // Map signed URLs to documents
        const documentsWithUrls = docs.map((doc, index) => ({
            ...doc,
            url: signedUrls?.[index]?.signedUrl || '',
        }))

        return documentsWithUrls as Document[]
    } catch (err) {
        console.error('getClientDocuments Unexpected Error:', err)
        return []
    }
}

export async function getClientProcedures(clientId: string) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('getClientProcedures Auth Error:', authError)
            return []
        }

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
            .order('created_at', { ascending: false })

        if (error) {
            console.error('getClientProcedures Error:', error)
            return []
        }
        return data ?? []
    } catch (err) {
        console.error('getClientProcedures Unexpected Error:', err)
        return []
    }
}
