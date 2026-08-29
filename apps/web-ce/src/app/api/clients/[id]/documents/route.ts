import { createClient } from '@carlosindriago/database/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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

        const { data: docs, error } = await supabase
            .from('documents')
            .select('*')
            .eq('client_id', id)
            .eq('organization_id', member.organization_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[GET /api/clients/[id]/documents] Error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        if (!docs || docs.length === 0) {
            return NextResponse.json({ success: true, data: [] })
        }

        // Generate signed URLs with 60s ephemeral expiry
        const { data: signedUrls, error: signedUrlError } = await supabase
            .storage
            .from('client-docs')
            .createSignedUrls(
                docs.map(d => d.storage_path),
                60
            )

        if (signedUrlError) {
            console.error('Error generating signed URLs:', signedUrlError)
            return NextResponse.json({ success: true, data: docs })
        }

        const documentsWithUrls = docs.map((doc, index) => ({
            ...doc,
            url: signedUrls?.[index]?.signedUrl || '',
        }))

        return NextResponse.json({ success: true, data: documentsWithUrls })
    } catch (error) {
        console.error('Unexpected error in GET /api/clients/[id]/documents:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
