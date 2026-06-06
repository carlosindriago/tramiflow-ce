import { Suspense } from 'react'
import { getProcedureStatusesAction } from '@/app/(dashboard)/procedures/actions'
import { StatusesManager } from '@/components/settings/statuses-manager'
import { ProcedureStatus as ProcedureStatusConfig } from '@carlosindriago/core'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@carlosindriago/ui'
import { Loader2 } from 'lucide-react'

export default async function ProcedureStatusesPage() {
    const statusesRes = await getProcedureStatusesAction()
    const statuses = (statusesRes.success && statusesRes.data) ? (statusesRes.data as ProcedureStatusConfig[]) : []

    if (!statusesRes.success) {
        return (
            <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg">
                Error cargando estados: {statusesRes.error}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Etiquetas de Estado (Kanban)</h2>
                <p className="text-muted-foreground">
                    Define las columnas y estados por los que pasan tus trámites.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Tablero</CardTitle>
                    <CardDescription>
                        Puedes añadir nuevas columnas, editar sus colores o eliminarlas si no tienen trámites.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
                        <StatusesManager statuses={statuses} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
