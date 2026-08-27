import { createClient } from '@carlosindriago/database/server'
import { KanbanBoard } from '@/components/procedures/kanban-board'
import { Procedure, ProcedureStatusConfig } from '@carlosindriago/core'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProceduresPage() {
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

    const [proceduresResult, clientsResult, templatesResult, statusesResult] = await Promise.all([
        supabase
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
            .order('created_at', { ascending: false }),
        supabase
            .from('clients')
            .select('id, full_name')
            .eq('organization_id', orgId)
            .order('full_name', { ascending: true }),
        supabase
            .from('procedure_templates')
            .select('id, name')
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .eq('is_archived', false)
            .order('name', { ascending: true }),
        supabase
            .from('procedure_statuses')
            .select('*')
            .eq('organization_id', orgId)
            .order('order_index', { ascending: true })
    ])

    if (proceduresResult.error) {
        console.error('Error loading procedures in ProceduresPage:', proceduresResult.error)
        return (
            <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg m-6">
                Error cargando trámites: {proceduresResult.error.message}
            </div>
        )
    }

    const unmappedProcedures = proceduresResult.data || []
    const procedures: Procedure[] = unmappedProcedures
        .filter(p => !p.status_details?.is_final)
        .map(p => ({
            ...p,
            status: p.status_id,
        })) as unknown as Procedure[]

    const clients = clientsResult.data || []
    const templates = templatesResult.data || []
    const statuses = (statusesResult.data || []) as unknown as ProcedureStatusConfig[]

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden">
            <div className="flex-none px-6 pt-6 pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestión de Trámites</h1>
                        <p className="text-sm text-muted-foreground">
                            Control de expedientes y flujo de trabajo.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 min-w-0 overflow-x-auto overflow-y-hidden px-6 pb-4 overscroll-contain">
                <KanbanBoard
                    initialProcedures={procedures}
                    clients={clients}
                    templates={templates}
                    statuses={statuses}
                />
            </div>
        </div>
    )
}
