import { AuditLogsView } from '@/components/settings/audit-logs-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Registro de Auditoría - TramiFlow',
    description: 'Historial de acciones y seguridad de la organización',
}

export default function AuditPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Registro de Auditoría</h2>
                <p className="text-muted-foreground">
                    Supervisa las acciones críticas realizadas por los miembros de tu organización.
                </p>
            </div>

            <AuditLogsView />
        </div>
    )
}
