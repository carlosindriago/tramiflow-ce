import { ProcedureArchiveTable } from '@/components/procedures/procedure-archive-table'

export default function ArchivePage() {
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
                <ProcedureArchiveTable />
            </div>
        </div>
    )
}
