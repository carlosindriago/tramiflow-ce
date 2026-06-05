import { notFound } from 'next/navigation'
/* eslint-disable */
import Image from 'next/image'
import { CheckCircle2, Circle, Clock, FileText, LayoutDashboard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tramiflow/ui'
import { Progress } from '@tramiflow/ui'
import { Separator } from '@tramiflow/ui'
import { Badge } from '@tramiflow/ui'
import { getPublicProcedureStatus } from '../actions'

interface StatusPageProps {
    params: Promise<{
        tracking_id: string
    }>
}

export default async function StatusPage({ params }: StatusPageProps) {
    const { tracking_id } = await params
    const procedure = await getPublicProcedureStatus(tracking_id)

    if (!procedure) {
        notFound()
    }

    // Calcular progreso visual simple
    // Fases: Recopilación (0-25%) -> Pagos (25-50%) -> En Proceso (50-90%) -> Finalizado (100%)
    // Esto es un ejemplo, idealmente vendría de `procedure.current_step_index` o similar.
    // Usaremos un mapeo básico del estado para la demo MVP.

    let progressValue = 10
    let currentPhase = 'Iniciado'

    // Mapeo simple de estados (esto debería ser dinámico basado en la configuración real)
    // Mapeo simple de estados (esto debería ser dinámico basado en la configuración real)
    const statusDetails = Array.isArray(procedure.status_details)
        ? procedure.status_details[0]
        : procedure.status_details

    const statusName = statusDetails?.name?.toLowerCase() || ''

    if (statusName.includes('pendiente') || statusName.includes('inicio')) {
        progressValue = 10
        currentPhase = 'Recopilación de Documentos'
    } else if (statusName.includes('pago') || statusName.includes('facturacion')) {
        progressValue = 40
        currentPhase = 'Verificación de Pagos'
    } else if (statusName.includes('proceso') || statusName.includes('curso')) {
        progressValue = 70
        currentPhase = 'Trámite en Curso'
    } else if (statusName.includes('finalizado') || statusName.includes('aprobado')) {
        progressValue = 100
        currentPhase = 'Finalizado'
    }

    const requirements = procedure.requirements_snapshot || []
    // Si no hay snapshot, podríamos intentar usar los del template si tuviéramos acceso, 
    // pero para seguridad solo mostramos lo que está en el procedure.

    const checklist = procedure.checklist_progress || {}

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="mx-auto max-w-2xl">
                {/* Header Branding */}
                <div className="mb-8 flex flex-col items-center text-center">
                    {/* Placeholder Logo si no hay URL */}
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border">
                        {/* {procedure.organization?.logo_url ? (
                            <Image 
                                src={procedure.organization.logo_url} 
                                alt="Logo" 
                                width={40} 
                                height={40} 
                                className="object-contain"
                            />
                        ) : (
                            <LayoutDashboard className="h-8 w-8 text-primary/50" />
                        )} */}
                        <LayoutDashboard className="h-8 w-8 text-primary/50" />
                    </div>
                    {/* <h2 className="text-lg font-semibold text-gray-700">{procedure.organization?.name || 'TramiFlow'}</h2> */}
                    <h2 className="text-lg font-semibold text-gray-700">Organización</h2>
                    <p className="text-sm text-muted-foreground">Seguimiento de Trámite</p>
                </div>

                <Card className="shadow-lg border-t-4 border-t-blue-500">
                    <CardHeader className="text-center pb-2">
                        <Badge variant="outline" className="w-fit mx-auto mb-2 capitalize"
                            style={{
                                borderColor: statusDetails?.color,
                                color: statusDetails?.color
                            }}>
                            {statusDetails?.name || 'En Proceso'}
                        </Badge>
                        <CardTitle className="text-2xl">{procedure.title}</CardTitle>
                        <CardDescription>
                            ID de seguimiento: <span className="font-mono text-xs">{procedure.tracking_id}</span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-8 pt-6">
                        {/* Progress Bar Visual */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <span>Inicio</span>
                                <span>Progreso</span>
                                <span>Fin</span>
                            </div>
                            <Progress value={progressValue} className="h-3" indicatorClassName="bg-blue-500" />
                            <p className="text-center text-sm font-medium text-blue-600 mt-2">
                                Fase Actual: {currentPhase}
                            </p>
                        </div>

                        <Separator />

                        {/* Documents Checklist */}
                        <div>
                            <h3 className="mb-4 font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                Lista de Requisitos
                            </h3>
                            <div className="space-y-3">
                                {requirements.length > 0 ? (
/* eslint-disable */
                                    requirements.map((req: any, i: number) => {
                                        const reqId = req.id || req // Handle string or object
                                        const reqTitle = req.title || req
                                        const isCompleted = checklist[reqId]

                                        return (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                                                {isCompleted ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                                                )}
                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                                                        {reqTitle}
                                                    </p>
                                                    {isCompleted && (
                                                        <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                                                            <CheckCircle2 className="h-3 w-3" /> Recibido
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground text-sm italic">
                                        No hay requisitos visibles para este trámite.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-blue-900 text-sm">Información</h4>
                                    <p className="text-blue-700 text-xs mt-1 leading-relaxed">
                                        Esta página se actualiza en tiempo real. Guarda este enlace para consultar el avance de tu trámite en cualquier momento.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400">Powered by TramiFlow &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </div >
    )
}
