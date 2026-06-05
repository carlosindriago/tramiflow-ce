'use server'

import { createClient } from '@/lib/supabase/server'
/* eslint-disable */
import { notFound } from 'next/navigation'

export async function getPublicProcedureStatus(trackingId: string) {
    const supabase = await createClient()

    // Query using tracking_id (publicly accessible via policy or function)
    // We want to return only safe data.

    // Since we added a policy "USING ( true )" for procedures, we can select by tracking_id.
    // However, we must be careful not to expose sensitive fields.
    // We will select specific columns.

    const { data: procedure, error } = await supabase
        .from('procedures')
        .select(`
            id,
            tracking_id,
            title,
            status,
            status_details:procedure_statuses(
                name,
                color,
                description
            ),
            checklist_progress,
            requirements_snapshot,
            payment_status,
            updated_at,
            created_at,
            organization:organizations(
                name,
                logo_url
            )
        `)
        .eq('tracking_id', trackingId)
        .single()

    if (error || !procedure) {
        // console.error('Error fetching public status:', error)
        return null
    }

    return procedure
}
