import { ProcedureArchiveTable } from '@/components/procedures/procedure-archive-table'
import { getProceduresAction } from '../procedures/actions'
import { Procedure } from '@carlosindriago/core'

export default async function ArchivePage() {
    const res = await getProceduresAction(true)
    const procedures = res.success ? (res.data as Procedure[]) : []
    const error = res.success ? null : res.error

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
                {error ? (
                    <div className="p-4 text-destructive bg-destructive/10 rounded-lg">
                        Error cargando archivos: {error}
                    </div>
                ) : (
                    <ProcedureArchiveTable initialProcedures={procedures} />
                )}
            </div>
        </div>
    )
}
