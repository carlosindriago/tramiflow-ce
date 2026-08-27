import { createClient } from '@carlosindriago/database/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function DELETE(
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
            return NextResponse.json({ success: false, error: 'No se encontró organización activa vinculada' }, { status: 400 })
        }

        // Obtener docs del cliente para limpiar storage
        const { data: docs } = await supabase
            .from('documents')
            .select('storage_path')
            .eq('client_id', id)
            .eq('organization_id', member.organization_id)

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
            .eq('client_id', id)
            .eq('organization_id', member.organization_id)

        // Eliminar el cliente
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)
            .eq('organization_id', member.organization_id)

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        try {
            const { logAudit } = await import('@carlosindriago/core/server')
            await logAudit(member.organization_id, 'CLIENT_DELETED', id, 'client')
        } catch (auditErr) {
            console.warn('logAudit failed:', auditErr)
        }

        try {
            revalidatePath('/clients')
        } catch (e) {
            console.warn('revalidatePath error ignored:', e)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unexpected error in DELETE /api/clients/[id]:', error)
        const message = error instanceof Error ? error.message : 'Error inesperado'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
