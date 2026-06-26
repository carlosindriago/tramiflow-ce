'use server'

import { createClient } from '@carlosindriago/database/server'
import { z } from 'zod'

const MAX_RESULTS = 5

const searchSchema = z
    .string()
    .transform((value) => value.trim())
    .pipe(
        z
            .string()
            .min(2, 'El término de búsqueda debe tener al menos 2 caracteres')
            .max(100)
    )

export async function searchGlobal(
    query: string
): Promise<{
    success: boolean
    clients?: Array<{ id: string; full_name: string; identification?: string }>
    tramites?: Array<{ id: string; title: string; status?: string }>
    error?: string
}> {
    try {
        const validatedQuery = searchSchema.parse(query)
        const searchPattern = `%${validatedQuery.toLowerCase()}%`

        const supabase = await createClient()
        
        // Get current user and organization
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autenticado' }

        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
        .single()

        if (!member) return { success: false, error: 'Sin organización' }

        // Search clients by full_name with org filter
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('id, full_name, identifications')
            .eq('organization_id', member.organization_id)
            .ilike('full_name', searchPattern)
            .limit(MAX_RESULTS)

        if (clientsError) {
            console.error('Client search error:', clientsError)
            return { success: false, error: 'Error al realizar la búsqueda' }
        }

        const clientsWithId = (clients || []).map(c => ({
            id: c.id,
            full_name: c.full_name,
            identification: c.identifications?.[0]?.number || ''
        }))

        // Search tramites by title with org filter
        const { data: tramites, error: tramitesError } = await supabase
            .from('procedures')
            .select('id, title, status')
            .eq('organization_id', member.organization_id)
            .ilike('title', searchPattern)
            .limit(MAX_RESULTS)

        if (tramitesError) {
            console.error('Tramite search error:', tramitesError)
            return { success: false, error: 'Error al realizar la búsqueda' }
        }

        return {
            success: true,
            clients: clientsWithId,
            tramites: tramites || [],
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message || 'Validación fallida' }
        }
        console.error('Search error:', error)
        return { success: false, error: 'Error al realizar la búsqueda' }
    }
}
