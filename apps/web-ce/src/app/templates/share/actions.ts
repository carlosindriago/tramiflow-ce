'use server'

import { createClient } from '@carlosindriago/database/server'
/* eslint-disable */
import { revalidatePath } from 'next/cache'
/* eslint-disable */
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function getSharedTemplateByToken(token: string) {
    const supabase = await createClient()

    // 1. Try to find by token (Public)
    const { data: publicTemplate } = await supabase
        .from('procedure_templates')
        .select('*, organizations(name)')
        .eq('share_token', token)
        .eq('visibility', 'public')
        .single()

    if (publicTemplate) return { success: true, template: publicTemplate, mode: 'public' }

    // 2. Try Restricted Access (must match token AND user permissions)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        // Authenticated user check for restricted template with same token
        const { data: restrictedTemplate } = await supabase
            .from('procedure_templates')
            .select('*')
            .eq('share_token', token)
            .eq('visibility', 'restricted')
            .single()

        if (restrictedTemplate) {
            // Check permissions explicitly
            const { data: permission } = await supabase
                .from('template_permissions')
                .select('*')
                .eq('template_id', restrictedTemplate.id)
                .eq('email', user.email)
                .single()

            if (permission) {
                return { success: true, template: restrictedTemplate, mode: 'restricted' }
            }
        }
    }

    return { success: false, error: 'Template not found or access denied' }
}

export async function importTemplateAction(templateId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    // 1. Get User's Organization
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return { success: false, error: 'No organization found' }

    // 2. Fetch Source Template (we assume user has access if they are calling this, 
    // but strict RLS should enforce it anyway)
    const { data: source, error: sourceError } = await supabase
        .from('procedure_templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (sourceError || !source) return { success: false, error: 'Template not found or access denied' }

    // 3. Clone
    const headersList = await headers()
    const country = headersList.get('x-vercel-ip-country') || 'Unknown'

    const { data: newTemplate, error: cloneError } = await supabase
        .from('procedure_templates')
        .insert({
            name: `${source.name} (Importada)`,
            organization_id: profile.organization_id,
            // Copy fields
            fees_professional: source.fees_professional,
            fees_official: source.fees_official,
            currency: source.currency,
            payment_terms: source.payment_terms,
            duration_work: source.duration_work,
            duration_resolution: source.duration_resolution,
            category: source.category,
            is_custom_category: source.is_custom_category,
            requires_renewal: source.requires_renewal,
            renewal_frequency: source.renewal_frequency,
            is_active: true,
            requirements: source.requirements, // JSONB copy
            steps: source.steps,             // JSONB copy
            // Reset sharing
            visibility: 'private',
            share_token: null,
            // Tracking
            source_template_id: templateId,
            source_ip_country: country
        })
        .select('id')
        .single()

    if (cloneError) {
        console.error('Clone Error:', cloneError)
        return { success: false, error: cloneError.message }
    }

    return { success: true, newId: newTemplate.id }
}
