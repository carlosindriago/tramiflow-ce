import { Suspense } from 'react'
import { getProceduresAction, getNewProcedureOptions, getProcedureStatusesAction } from './actions'
import { KanbanBoard } from '@/components/procedures/kanban-board'
import { Loader2 } from 'lucide-react'
import { Procedure } from '@/types/procedure'
import { ProcedureStatus as ProcedureStatusConfig } from '@/types/procedure-status'

export default async function ProceduresPage() {
    const [proceduresRes, optionsRes, statusesRes] = await Promise.all([
        getProceduresAction(false),
        getNewProcedureOptions(),
        getProcedureStatusesAction()
    ])

    const procedures = (proceduresRes.success && proceduresRes.data) ? (proceduresRes.data as Procedure[]) : []
    const clients = (optionsRes.success && optionsRes.data) ? optionsRes.data.clients : []
    const templates = (optionsRes.success && optionsRes.data) ? optionsRes.data.templates : []
    const statuses = (statusesRes.success && statusesRes.data) ? (statusesRes.data as ProcedureStatusConfig[]) : []

    if (!proceduresRes.success) {
        return (
            <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg">
                Error cargando trámites: {proceduresRes.error}
            </div>
        )
    }

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
