import { createClient } from '@carlosindriago/database/server'
import { ProcedureArchiveTable } from '@/components/procedures/procedure-archive-table'
import { Procedure } from '@carlosindriago/core'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ArchivePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    if (!member?.organization_id) {
        redirect('/onboarding')
    }

    const orgId = member.organization_id

    const { data, error } = await supabase
        .from('procedures')
        .select(`
            *,
            client:clients(id, full_name, email),
            template:procedure_templates(
                id,
                name,
                requirements,
                steps,
                fees_professional:fees,
                fees_official:government_fee
            ),
            status_details:procedure_statuses(*)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error loading archive in ArchivePage:', error)
        return (
            <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg m-6">
                Error cargando trámites archivados: {error.message}
            </div>
        )
    }

    const procedures = (data || [])
        .filter(p => p.status_details?.is_final)
        .map(p => ({
            ...p,
            status: p.status_id,
        })) as unknown as Procedure[]

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex-none p-6 pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Archivo de Trámites</h1>
                    <p className="text-muted-foreground">
                        Historial de trámites finalizados.
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 pt-0">
                <ProcedureArchiveTable initialProcedures={procedures} />
            </div>
        </div>
    )
}
