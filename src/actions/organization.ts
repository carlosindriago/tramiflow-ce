'use client'

import { createClient } from '@/lib/supabase/client'
import { onboardingSchema, type OnboardingActionResult } from '@/types/organization'
import { seedDefaultProcedureStatuses } from '@/app/(dashboard)/settings/statuses/actions'

export async function createOrganizationAction(formData: FormData): Promise<OnboardingActionResult> {
    const supabase = createClient()

    // Get current user
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: { _form: ['Debes estar autenticado para crear una organización'] },
        }
    }

    // Extract and validate form data
    const rawData = {
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
        name: formData.get('name') as string,
        country: formData.get('country') as string,
        city: formData.get('city') as string,
        whatsapp_contact: formData.get('whatsapp_contact') as string,
        logo: formData.get('logo') as File | null,
    }

    // Parse with Zod
    const validationResult = onboardingSchema.safeParse(rawData)

    if (!validationResult.success) {
        const flattened = validationResult.error.flatten()
        return {
            success: false,
            error: {
                _form: flattened.formErrors,
                full_name: flattened.fieldErrors.full_name,
                phone: flattened.fieldErrors.phone,
                name: flattened.fieldErrors.name,
                country: flattened.fieldErrors.country,
                city: flattened.fieldErrors.city,
                whatsapp_contact: flattened.fieldErrors.whatsapp_contact,
                logo: flattened.fieldErrors.logo?.map(String),
            },
        }
    }

    const { full_name, phone, name, country, city, whatsapp_contact, logo } = validationResult.data

    try {
        // 1. Check if user already has organizations
        const { data: existingOrgs, error: checkError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)

        if (checkError) {
            console.error('Error checking existing organizations:', checkError)
            return {
                success: false,
                error: { _form: ['Error al verificar organizaciones existentes'] },
            }
        }

        // User already has an organization, should not be here
        if (existingOrgs && existingOrgs.length > 0) {
            return {
                success: false,
                error: { _form: ['Ya tienes una organización configurada'] },
            }
        }

        // 2. Generate slug from name
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special chars
            .replace(/[\s_]+/g, '-') // Spaces to hyphens
            .replace(/^-+|-+$/g, '') // Trim hyphens

        // 3. Upload logo if provided
        let logoUrl: string | null = null

        if (logo) {
            // Generate unique filename
            const fileExt = logo.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            // Upload to branding bucket
            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(fileName, logo, {
                    upsert: false,
                    contentType: logo.type,
                })

            if (uploadError) {
                console.error('Error uploading logo:', uploadError)
                return {
                    success: false,
                    error: { logo: ['Error al subir el logo. Intenta con otra imagen.'] },
                }
            }

            // Get public URL
            const { data: urlData } = supabase.storage.from('branding').getPublicUrl(fileName)
            logoUrl = urlData.publicUrl
        }

        // 4. Create organization with user as owner (using PostgreSQL function)
        const { data: orgData, error: orgError } = await supabase.rpc('create_organization_with_owner', {
            p_name: name,
            p_slug: slug,
            p_logo_url: logoUrl,
            p_plan: 'free',
        })

        if (orgError) {
            // Handle duplicate name error
            if (orgError.message.includes('already exists')) {
                return {
                    success: false,
                    error: { name: ['Este nombre ya está en uso. Prueba con otro.'] },
                }
            }

            console.error('Error creating organization:', orgError)
            return {
                success: false,
                error: { _form: ['Error al crear la organización. Intenta nuevamente.'] },
            }
        }

        const newOrgId = orgData as string

        // 4.1 Update user profile with personal data
        await supabase
            .from('profiles')
            .update({
                full_name,
                phone
            })
            .eq('id', user.id)

        // 4.2 Update organization with additional data
        await supabase
            .from('organizations')
            .update({
                country,
                city,
                whatsapp_contact
            })
            .eq('id', newOrgId)

        // 4.5 Seed Default Kanban Statuses
        const seedResult = await seedDefaultProcedureStatuses(newOrgId)
        if (!seedResult.success) {
            console.warn('Seeding failed but organization was created:', seedResult.error)
            // We don't block the onboarding for this, but log it
        }

        return {
            success: true,
            organizationId: newOrgId,
        }
    } catch (error) {
        console.error('Unexpected error in createOrganizationAction:', error)
        return {
            success: false,
            error: { _form: ['Error inesperado. Contacta soporte si persiste.'] },
        }
    }
}
