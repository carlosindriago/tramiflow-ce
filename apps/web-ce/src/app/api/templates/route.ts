import { createClient } from '@carlosindriago/database/server'
import { templateSchema } from '@carlosindriago/core'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
        }

        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError || !member?.organization_id) {
            return NextResponse.json({ success: false, error: 'No se encontró organización' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('procedure_templates')
            .select('id, name, requirements, steps, fees, government_fee, duration_work, is_active, is_archived')
            .eq('organization_id', member.organization_id)
            .eq('is_active', true)
            .eq('is_archived', false)
            .order('name', { ascending: true })

        if (error) {
            console.error('[GET /api/templates] Error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: data || [] })
    } catch (error) {
        console.error('Unexpected error in GET /api/templates:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
        }

        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError || !member?.organization_id) {
            return NextResponse.json({ success: false, error: 'No se encontró organización activa vinculada' }, { status: 400 })
        }

        const body = await req.json()
        const parsed = templateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Validación fallida', fieldErrors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        // Ensure profile exists in public.profiles to satisfy Foreign Key constraint
        try {
            await supabase
                .from('profiles')
                .upsert({ id: user.id, email: user.email }, { onConflict: 'id', ignoreDuplicates: true })
        } catch (profileErr) {
            console.warn('Profile upsert warning:', profileErr)
        }

        const stepsWithOrder = (parsed.data.steps || []).map((step, index) => ({
            ...step,
            order_index: index,
        }))

        const publicSettings = {
            ...(parsed.data.public_settings || {}),
            currency: parsed.data.currency || 'PEN',
            duration_work: parsed.data.durationWork ?? 5,
            duration_resolution: parsed.data.durationResolution ?? 0,
            is_custom_category: parsed.data.isCustomCategory ?? false,
            requires_renewal: parsed.data.requiresRenewal ?? false,
            renewal_frequency: parsed.data.renewalFrequency ?? null,
            allow_copy: parsed.data.public_settings?.allow_copy ?? true,
            show_fees: parsed.data.public_settings?.show_fees ?? true,
            show_requirements: parsed.data.public_settings?.show_requirements ?? true,
            show_steps: parsed.data.public_settings?.show_steps ?? true,
        }

        const templateData = {
            organization_id: member.organization_id,
            created_by: user.id,
            name: parsed.data.name,
            category: parsed.data.category || null,

            fees: parsed.data.feesProfessional ?? 0,
            fees_professional: parsed.data.feesProfessional ?? 0,
            fees_official: parsed.data.feesOfficial ?? 0,
            government_fee: parsed.data.feesOfficial ?? 0,
            payment_terms: parsed.data.paymentTerms || 'upfront',
            currency: parsed.data.currency || 'PEN',

            duration_work: parsed.data.durationWork ?? 5,
            duration_resolution: parsed.data.durationResolution ?? 0,
            is_custom_category: parsed.data.isCustomCategory ?? false,
            requires_renewal: parsed.data.requiresRenewal ?? false,
            renewal_frequency: parsed.data.renewalFrequency ?? null,

            is_active: parsed.data.isActive ?? true,
            requirements: parsed.data.requirements || [],
            steps: stepsWithOrder,
            visibility: parsed.data.visibility || 'private',
            public_settings: publicSettings,
        }

        let result
        if (body.id) {
            result = await supabase
                .from('procedure_templates')
                .update(templateData)
                .eq('id', body.id)
                .eq('organization_id', member.organization_id)
                .select('id')
                .maybeSingle()
        } else {
            result = await supabase
                .from('procedure_templates')
                .insert(templateData)
                .select('id')
                .maybeSingle()
        }

        if (result.error || !result.data) {
            console.error('Database error saving template:', result.error)
            return NextResponse.json(
                { success: false, error: result.error?.message || 'Error al guardar plantilla en base de datos' },
                { status: 500 }
            )
        }

        try {
            revalidatePath('/templates')
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return NextResponse.json({ success: true, data: { id: result.data.id } })
    } catch (error) {
        console.error('Unexpected error in POST /api/templates:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado del servidor'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
