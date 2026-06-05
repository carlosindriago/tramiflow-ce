'use client'

import { Procedure, ProcedureStatus, PROCEDURE_STATUS_LABELS } from '@/types/procedure'
import { ProcedureStatus as ProcedureStatusConfig } from '@/types/procedure-status'
import {
    updateProcedureChecklistAction,
    updateProcedureStatusAction,
    updateProcedurePaymentStatusAction,
    updateProcedureStepAction,
    getProcedureByIdAction,
    getProcedureStatusesAction
} from '@/app/(dashboard)/procedures/actions'
import {
    getProcedureDocumentsAction,
    linkDocumentToProcedureAction,
    unlinkDocumentFromProcedureAction
} from '@/app/(dashboard)/procedures/documents-actions'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
/* eslint-disable */
    LayoutDashboard,
    ArrowLeft,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
/* eslint-disable */
    Calendar,
/* eslint-disable */
    ChevronRight,
/* eslint-disable */
    Search,
/* eslint-disable */
    Filter,
/* eslint-disable */
    MoreVertical,
    User,
/* eslint-disable */
    Building2,
/* eslint-disable */
    CalendarDays,
/* eslint-disable */
    AlertCircle,
/* eslint-disable */
    Check,
    Phone,
    Link2,
    Unlink2,
    Loader2,
    ListChecks,
    CheckSquare,
    DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PhoneAction } from '@/components/ui/phone-action'
import { DocumentGrid } from '@/components/documents/document-grid'
import { SmartDropzone } from '@/components/documents/smart-dropzone'
import { ImagesToPdfDialog } from '@/components/pdf-tools/images-to-pdf-dialog'
import { MergePdfsDialog } from '@/components/pdf-tools/merge-pdfs-dialog'
import { SmartScannerDialog } from '@/components/documents/smart-scanner-dialog'
import { getClientDocuments } from '@/app/(dashboard)/clients/[id]/actions'
import { use, useState } from 'react'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { es } from 'date-fns/locale'
import type { Document } from '@/types/document'

interface ProcedurePageProps {
    params: Promise<{
        id: string
    }>
}

export default function ProcedurePage({ params }: ProcedurePageProps) {
    const { id: procedureId } = use(params)
    const [isLoading, setIsLoading] = useState(false)
    const [imagesToPdfDocs, setImagesToPdfDocs] = useState<Document[]>([])
    const [mergePdfDocs, setMergePdfDocs] = useState<Document[]>([])
    const [scannerDoc, setScannerDoc] = useState<Document | null>(null)
    const queryClient = useQueryClient()

    // Fetch statuses
    const { data: statuses = [] } = useQuery<ProcedureStatusConfig[]>({
        queryKey: ['procedure-statuses'],
        queryFn: async () => {
            const res = await getProcedureStatusesAction()
            if (!res.success) return []
            return res.data as ProcedureStatusConfig[]
        }
    })

    // Fetch procedure data
    const { data: procedure, isLoading: isFetching, refetch } = useQuery<Procedure>({
        queryKey: ['procedure', procedureId],
        queryFn: async () => {
            const res = await getProcedureByIdAction(procedureId)
            if (!res.success) throw new Error(res.error)
            return res.data as Procedure
        }
    })

    // Fetch client documents (dependent on procedure)
    const { data: clientDocuments, isLoading: isClientDocsLoading } = useQuery({
        queryKey: ['client-documents', procedure?.client?.id],
        queryFn: async () => {
            if (!procedure?.client?.id) return []
            return await getClientDocuments(procedure.client.id)
        },
        enabled: !!procedure?.client?.id
    })

    // Fetch procedure documents
    const { data: procedureDocuments, isLoading: isProcedureDocsLoading, refetch: refetchProcedureDocs } = useQuery({
        queryKey: ['procedure-documents', procedureId],
        queryFn: async () => {
            const res = await getProcedureDocumentsAction(procedureId)
            if (!res.success) throw new Error(res.error)
            return res.data
        }
    })

    // Link Document Mutation
    const linkDocumentMutation = useMutation({
        mutationFn: async (documentId: string) => {
            const res = await linkDocumentToProcedureAction(procedureId, documentId)
            if (!res.success) throw new Error(res.error)
            return { success: true }
        },
        onSuccess: () => {
            toast.success('Documento vinculado correctamente')
            refetchProcedureDocs()
        },
        onError: (err) => {
            toast.error('Error al vincular documento: ' + err.message)
        }
    })

    // Unlink Document Mutation
    const unlinkDocumentMutation = useMutation({
        mutationFn: async (documentId: string) => {
            const res = await unlinkDocumentFromProcedureAction(procedureId, documentId)
            if (!res.success) throw new Error(res.error)
            return { success: true }
        },
        onSuccess: () => {
            toast.success('Documento desvinculado correctamente')
            refetchProcedureDocs()
        },
        onError: (err) => {
            toast.error('Error al desvincular documento: ' + err.message)
        }
    })

    if (isFetching) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!procedure) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <FileText className="h-12 w-12 text-muted-foreground/40" />
                <h2 className="mt-4 text-lg font-medium">Trámite no encontrado</h2>
                <Link href="/procedures">
                    <Button variant="outline" className="mt-4 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Trámites
                    </Button>
                </Link>
            </div>
        )
    }

    // Helper to get status color/name
    const currentStatusConfig = statuses.find(s => s.id === procedure?.status) || procedure?.status_details

    const getStatusColorStyle = (statusId: string) => {
        const config = statuses.find(s => s.id === statusId)
        if (!config) return {}
        return {
            backgroundColor: `${config.color}20`, // 20 hex opacity ~ 12%
            color: config.color,
            borderColor: `${config.color}40`
        }
    }

    // Determine state
    const checklist = procedure.checklist_progress || {}
    const paymentStatus = procedure.payment_status || 'pending'
    const currentStep = procedure.current_step_index || 0
    const requirements = procedure.requirements_snapshot || []
    const totalReqs = requirements.length
/* eslint-disable */
    const completedReqs = requirements.filter((r: any) => checklist[r.id || r]).length
    const progress = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0
    const steps = procedure.template?.steps || []
    const totalSteps = steps.length

    // Handlers
    const handleChecklistChange = async (reqId: string, checked: boolean) => {
        // Optimistic update logic if needed, but react-query refetch is safer for consistency
        // For better UX, we can mutate local cache or just rely on fast revalidation
        // Let's do optimistic purely for UI feels, but we need full object refetch to be sure

        const newChecklist = { ...checklist, [reqId]: checked }
        // We can't easily mutate the query cache deeply here without complex logic
        // So we will just fire the action and refetch. 
        // To avoid UI lag, we could set a local state? 
        // But ProcedurePage is reading from `procedure` prop from useQuery.
        // Let's implement optimistic update via queryClient.setQueryData later if needed.
        // For now, let's just wait for action and refetch.

        try {
            const result = await updateProcedureChecklistAction(procedureId, newChecklist)
            if (!result.success) throw new Error(result.error)
            refetch()
/* eslint-disable */
        } catch (error) {
            toast.error('Error actualizando checklist')
        }
    }

    const handleStatusChange = async (status: ProcedureStatus) => {
        setIsLoading(true)
        try {
            const result = await updateProcedureStatusAction(procedureId, status)
            if (!result.success) throw new Error(result.error)
            refetch()
            toast.success('Estado actualizado')
/* eslint-disable */
        } catch (error) {
            toast.error('Error actualizando estado')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePaymentChange = async (status: 'pending' | 'partial' | 'paid') => {
        try {
            const result = await updateProcedurePaymentStatusAction(procedureId, status)
            if (!result.success) throw new Error(result.error)
            refetch()
            toast.success('Estado de pago actualizado')
/* eslint-disable */
        } catch (error) {
            toast.error('Error actualizando pago')
        }
    }

    const isFinalized = procedure.status === 'approved' || procedure.status === 'rejected'

    const handleStepComplete = async (index: number) => {
        if (isFinalized) return
        const newIndex = index + 1
        try {
            const result = await updateProcedureStepAction(procedureId, newIndex)
            if (!result.success) throw new Error(result.error)
            refetch()
            toast.success('Progreso actualizado')
/* eslint-disable */
        } catch (error) {
            toast.error('Error actualizando paso')
        }
    }

    const handleStepRevert = async (index: number) => {
        if (isFinalized) return
        try {
            const result = await updateProcedureStepAction(procedureId, index)
            if (!result.success) throw new Error(result.error)
            refetch()
            toast.success('Paso corregido')
/* eslint-disable */
        } catch (error) {
            toast.error('Error corrigiendo paso')
        }
    }


    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6 md:p-8">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/procedures" className="hover:text-primary transition-colors">Trámites</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium truncate max-w-[200px]">{procedure.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{procedure.title}</h1>
                        <Select
                            disabled={isLoading}
                            value={procedure.status}
                            onValueChange={(val) => handleStatusChange(val as ProcedureStatus)}
                        >
                            <SelectTrigger
                                className="w-[180px] h-8 text-xs font-medium border-transparent transition-colors"
                                style={getStatusColorStyle(procedure.status)}
                            >
                                <SelectValue>
                                    {currentStatusConfig?.name || PROCEDURE_STATUS_LABELS[procedure.status] || procedure.status}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.length > 0 ? (
                                    statuses.map((status) => (
                                        <SelectItem key={status.id} value={status.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: status.color }}
                                                />
                                                {status.name}
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    Object.entries(PROCEDURE_STATUS_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <Loader2 className={cn("h-4 w-4 mr-2", isFetching ? "animate-spin" : "")} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Workflow */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Progress Overview */}
                    <Card className="overflow-hidden border-l-4 border-l-primary/40">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg">Progreso General</h3>
                                    <p className="text-sm text-muted-foreground">Basado en requisitos y pasos completados</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-primary">{Math.round((progress + (totalSteps > 0 ? currentStep / totalSteps * 100 : 0)) / 2)}%</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>Requisitos</span>
                                        <span className="font-medium">{completedReqs}/{totalReqs}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>Pasos</span>
                                        <span className="font-medium">{currentStep}/{totalSteps}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="steps" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-12">
                            <TabsTrigger value="steps" className="text-sm gap-2">
                                <ListChecks className="h-4 w-4" />
                                Pasos del Proceso
                            </TabsTrigger>
                            <TabsTrigger value="requirements" className="text-sm gap-2">
                                <CheckSquare className="h-4 w-4" />
                                Requisitos
                            </TabsTrigger>
                            <TabsTrigger value="documents" className="text-sm gap-2">
                                <FileText className="h-4 w-4" />
                                Documentos
                            </TabsTrigger>
                        </TabsList>

                        {/* STEPS CONTENT */}
                        <TabsContent value="steps" className="mt-6 space-y-4 animate-in fade-in-50">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        Línea de Tiempo
                                    </CardTitle>
                                    <CardDescription>Sigue el flujo del trámite paso a paso.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {steps.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">No hay pasos definidos.</div>
                                    ) : (
                                        <div className="relative pl-6 border-l-2 border-muted space-y-8 my-2 ml-2">
/* eslint-disable */
                                            {steps.map((step: any, index: number) => {
                                                const isCompleted = index < currentStep
                                                const isCurrent = index === currentStep
                                                const stepTitle = typeof step === 'string' ? step : step.title
                                                const stepDesc = typeof step === 'object' ? step.description : ''

                                                return (
                                                    <div key={index} className={cn(
                                                        "relative pl-8 transition-all",
                                                        isCompleted && isFinalized ? "opacity-60" : "opacity-100"
                                                    )}>
                                                        <div className={cn(
                                                            "absolute -left-[33px] top-0 rounded-full border-4 w-6 h-6 bg-background flex items-center justify-center transition-all z-10",
                                                            isCompleted
                                                                ? "border-primary bg-primary"
                                                                : isCurrent
                                                                    ? "border-primary ring-4 ring-primary/20 scale-110"
                                                                    : "border-muted-foreground/30"
                                                        )}>
                                                            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                                                        </div>
                                                        <div className="space-y-2 p-4 rounded-xl border bg-card transition-shadow hover:shadow-sm">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className={cn(
                                                                    "font-semibold text-base",
                                                                    isCompleted && "line-through text-muted-foreground"
                                                                )}>
                                                                    {stepTitle}
                                                                </h4>
                                                                <Badge variant={isCompleted ? "secondary" : isCurrent ? "default" : "outline"}>
                                                                    {isCompleted ? "Completado" : isCurrent ? "En progreso" : "Pendiente"}
                                                                </Badge>
                                                            </div>
                                                            {stepDesc && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {stepDesc}
                                                                </p>
                                                            )}
                                                            {!isFinalized && (
                                                                <div className="pt-2 flex flex-wrap gap-2">
                                                                    {isCurrent && (
                                                                        <Button
                                                                            size="sm"
                                                                            className="w-full sm:w-auto"
                                                                            onClick={() => handleStepComplete(index)}
                                                                        >
                                                                            Marcar paso como completado
                                                                        </Button>
                                                                    )}
                                                                    {isCompleted && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="w-full sm:w-auto text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                            onClick={() => handleStepRevert(index)}
                                                                        >
                                                                            <Unlink2 className="h-3.5 w-3.5 mr-2" />
                                                                            Corregir (Desmarcar)
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* REQUIREMENTS CONTENT */}
                        <TabsContent value="requirements" className="mt-6 animate-in fade-in-50">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4 text-primary" />
                                        Lista de Verificación
                                    </CardTitle>
                                    <CardDescription>Marca los requisitos a medida que se cumplan.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    {requirements.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic text-center py-8">
                                            Este trámite no tiene requisitos definidos.
                                        </p>
                                    )}
/* eslint-disable */
                                    {requirements.map((req: any, index: number) => {
                                        const reqId = req.id || req
                                        const reqTitle = req.title || req
                                        const isChecked = !!checklist[reqId]

                                        return (
                                            <div key={index} className={cn(
                                                "flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200",
                                                isChecked ? "bg-muted/30 border-transparent" : "bg-card hover:bg-muted/50"
                                            )}>
                                                <Checkbox
                                                    id={`req-${index}`}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => handleChecklistChange(reqId, checked as boolean)}
                                                    className="mt-1"
                                                />
                                                <div className="grid gap-1.5 leading-none w-full">
                                                    <Label
                                                        htmlFor={`req-${index}`}
                                                        className={cn(
                                                            "text-sm font-medium leading-none cursor-pointer select-none py-1 block w-full",
                                                            isChecked ? "line-through text-muted-foreground" : "text-foreground"
                                                        )}
                                                    >
                                                        {reqTitle}
                                                    </Label>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="documents" className="mt-6 animate-in fade-in-50 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Documentos del Trámite
                                    </CardTitle>
                                    <CardDescription>
                                        Archivos vinculados específicamente a este procedimiento.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {procedure.client?.id ? (
                                        <>
                                            <SmartDropzone
                                                clientId={procedure.client.id}
                                                organizationId={procedure.organization_id}
                                                procedureId={procedureId}
                                                onUploadComplete={() => {
                                                    queryClient.invalidateQueries({
                                                        queryKey: ['client-documents', procedure.client?.id]
                                                    })
                                                    refetchProcedureDocs()
                                                }}
                                            />
                                            <div className="mt-6">
                                                {isProcedureDocsLoading ? (
                                                    <div className="flex justify-center py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-medium text-muted-foreground">Documentos Vinculados ({procedureDocuments?.length || 0})</h4>
                                                        <DocumentGrid
                                                            documents={(procedureDocuments || []) as Document[]}
                                                            clientId={procedure.client.id}
                                                            allowDelete={false}
                                                            customAction={{
                                                                icon: Unlink2,
                                                                label: "Desvincular del trámite",
                                                                onClick: (doc) => unlinkDocumentMutation.mutate(doc.id)
                                                            }}
                                                            onCreatePdfFromImages={(docs) => setImagesToPdfDocs(docs)}
                                                            onMergePdfs={(docs) => setMergePdfDocs(docs)}
                                                            onScanImage={(doc) => setScannerDoc(doc)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No se puede cargar la zona de carga (Falta cliente).
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Biblioteca de Documentos del Cliente
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Documentos generales del cliente. Puedes vincularlos a este trámite.
                                </p>
                                <Separator />
                                {isClientDocsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <DocumentGrid
/* eslint-disable */
                                        documents={clientDocuments?.filter((doc: any) => !procedureDocuments?.some((pDoc: any) => pDoc.id === doc.id)) || []}
                                        clientId={procedure.client?.id || ''}
                                        customAction={{
                                            icon: Link2,
                                            label: "Vincular al trámite",
                                            onClick: (doc) => linkDocumentMutation.mutate(doc.id)
                                        }}
                                    />
                                )}
                            </div>
                        </TabsContent>

                        {/* ── PDF Tool Dialogs ── */}
                        {procedure.client && (
                            <>
                                <ImagesToPdfDialog
                                    open={imagesToPdfDocs.length > 0}
                                    onOpenChange={(open) => { if (!open) setImagesToPdfDocs([]) }}
                                    documents={imagesToPdfDocs}
                                    clientId={procedure.client.id}
                                    organizationId={procedure.organization_id}
                                    procedureId={procedureId}
                                    onComplete={() => {
                                        refetchProcedureDocs()
                                        queryClient.invalidateQueries({
                                            queryKey: ['client-documents', procedure.client?.id]
                                        })
                                    }}
                                />
                                <MergePdfsDialog
                                    open={mergePdfDocs.length > 0}
                                    onOpenChange={(open) => { if (!open) setMergePdfDocs([]) }}
                                    documents={mergePdfDocs}
                                />
                                <SmartScannerDialog
                                    open={!!scannerDoc}
                                    onOpenChange={(open) => { if (!open) setScannerDoc(null) }}
                                    doc={scannerDoc}
                                />
                            </>
                        )}
                    </Tabs>
                </div>

                {/* Right Column: Context */}
                <div className="space-y-6">

                    {/* Client Card */}
                    {procedure.client && (
                        <Card>
                            <CardHeader className="pb-3 bg-muted/30">
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" />
                                        Cliente
                                    </span>
                                    <Link href={`/clients/${procedure.client.id}`}>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <ArrowLeft className="h-3 w-3 rotate-180" />
                                        </Button>
                                    </Link>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {procedure.client.full_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{procedure.client.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{procedure.client.email || 'Sin email'}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
/* eslint-disable */
                                    {procedure.client && (procedure.client as any).phone ? (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
/* eslint-disable */
                                            <PhoneAction phone={(procedure.client as any).phone} />
                                        </div>
                                    ) : null}
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CreditCard className="h-3.5 w-3.5" />
/* eslint-disable */
                                        <span>{(procedure.client as any).document_number || 'No ID'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Financial Card */}
                    <Card>
                        <CardHeader className="pb-3 bg-muted/30">
                            <CardTitle className="text-base flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                Finanzas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-6">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="p-3 rounded-lg bg-emerald-50 text-center border border-emerald-100">
                                    <p className="text-xs text-emerald-600/80 uppercase font-medium mb-1">Honorarios</p>
                                    <p className="text-xl font-bold text-emerald-700">
                                        {procedure.template?.fees_professional ? `S/ ${procedure.template.fees_professional}` : 'S/ 0.00'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50 text-center border border-blue-100">
                                    <p className="text-xs text-blue-600/80 uppercase font-medium mb-1">Tasa Oficial</p>
                                    <p className="text-xl font-bold text-blue-700">
                                        {procedure.template?.fees_official ? `S/ ${procedure.template.fees_official}` : 'S/ 0.00'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-medium uppercase text-muted-foreground">Estado del Pago</Label>
                                <Select
                                    value={paymentStatus}
/* eslint-disable */
                                    onValueChange={(val: any) => handlePaymentChange(val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="partial">Parcial</SelectItem>
                                        <SelectItem value="paid">Pagado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meta Info */}
                    <Card>
                        <CardContent className="p-4 space-y-3 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Creado:</span>
                                <span>{procedure.created_at ? format(new Date(procedure.created_at), 'dd MMM yyyy', { locale: es }) : '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Actualizado:</span>
                                <span>{procedure.updated_at ? format(new Date(procedure.updated_at), 'dd MMM yyyy', { locale: es }) : '-'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
