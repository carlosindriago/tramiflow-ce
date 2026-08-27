'use client'

import { Procedure, ProcedureStatusConfig, getPrimaryIdentificationNumber } from '@carlosindriago/core'
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
} from '@carlosindriago/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@carlosindriago/ui'
import { Checkbox } from '@carlosindriago/ui'
import { Label } from '@carlosindriago/ui'
import { Badge } from '@carlosindriago/ui'
import { Button } from '@carlosindriago/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@carlosindriago/ui'
import { Separator } from '@carlosindriago/ui'
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    User,
    Phone,
    Link2,
    Unlink2,
    Loader2,
    ListChecks,
    CheckSquare,
    DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@carlosindriago/core'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PhoneAction } from '@carlosindriago/ui'
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
import type { Document } from '@carlosindriago/core'

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
            const res = await fetch('/api/procedures/statuses')
            const json = await res.json()
            if (!json.success) return []
            return json.data
        }
    })

    // Fetch procedure data
    const { data: procedure, isLoading: isFetching, refetch } = useQuery<Procedure>({
        queryKey: ['procedure', procedureId],
        queryFn: async () => {
            const res = await fetch(`/api/procedures/${procedureId}`)
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            return json.data as unknown as Procedure
        }
    })

    // Fetch client documents (dependent on procedure)
    const { data: clientDocuments = [], isLoading: isClientDocsLoading } = useQuery({
        queryKey: ['client-documents', procedure?.client?.id],
        queryFn: async () => {
            if (!procedure?.client?.id) return []
            const res = await getClientDocuments(procedure.client.id)
            return res.success ? res.data : []
        },
        enabled: !!procedure?.client?.id
    })

    // Fetch procedure documents
    const { data: procedureDocuments = [], isLoading: isProcedureDocsLoading, refetch: refetchProcedureDocs } = useQuery({
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
        onError: (err: Error) => {
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
        onError: (err: Error) => {
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

    // Determine state
    const checklist = procedure.checklist_progress || {}
    const paymentStatus = procedure.payment_status || 'pending'
    const currentStep = procedure.current_step_index || 0
    const requirements = procedure.requirements_snapshot || []
    const totalReqs = requirements.length
    const completedReqs = requirements.filter((r) => {
        const key = typeof r === 'object' && r !== null && 'id' in r ? String((r as { id: string }).id) : String(r)
        return Boolean(checklist[key])
    }).length
    const progress = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0
    const steps = procedure.template?.steps || []
    const totalSteps = steps.length

    // Handlers
    const handleChecklistChange = async (reqId: string, checked: boolean) => {
        const newChecklist = { ...checklist, [reqId]: checked }

        try {
            const res = await fetch(`/api/procedures/${procedureId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checklist_progress: newChecklist }),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            refetch()
        } catch (error) {
            console.error('Checklist update error:', error)
            toast.error('Error actualizando checklist')
        }
    }

    const handleStatusChange = async (status: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/procedures/${procedureId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_id: status }),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            refetch()
            toast.success('Estado actualizado')
        } catch (error) {
            console.error('Status change error:', error)
            toast.error('Error actualizando estado')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePaymentChange = async (status: 'pending' | 'partial' | 'paid') => {
        try {
            const res = await fetch(`/api/procedures/${procedureId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_status: status }),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            refetch()
            toast.success('Estado de pago actualizado')
        } catch (error) {
            console.error('Payment change error:', error)
            toast.error('Error actualizando pago')
        }
    }

    const isFinalized = procedure.status === 'approved' || procedure.status === 'rejected'

    const handleStepComplete = async (index: number) => {
        if (isFinalized) return
        const newIndex = index + 1
        try {
            const res = await fetch(`/api/procedures/${procedureId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_step_index: newIndex }),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            refetch()
            toast.success('Progreso actualizado')
        } catch (error) {
            console.error('Step complete error:', error)
            toast.error('Error actualizando paso')
        }
    }

    const handleStepRevert = async (index: number) => {
        if (isFinalized) return
        try {
            const res = await fetch(`/api/procedures/${procedureId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_step_index: index }),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            refetch()
            toast.success('Paso corregido')
        } catch (error) {
            console.error('Step revert error:', error)
            toast.error('Error corrigiendo paso')
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-24">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Link href="/procedures" className="text-muted-foreground hover:text-foreground">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight">{procedure.title}</h1>
                    </div>
                    <p className="text-sm text-muted-foreground pl-9">
                        Cliente: <span className="font-semibold text-foreground">{procedure.client?.full_name}</span> &bull; {procedure.template?.name || 'Trámite Personalizado'}
                    </p>
                </div>

                {/* Status selector & Actions */}
                <div className="flex items-center gap-3 pl-9 md:pl-0">
                    <Select
                        value={procedure.status}
                        onValueChange={handleStatusChange}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {statuses.map((status) => (
                                <SelectItem key={status.id} value={status.id}>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{ backgroundColor: status.color }}
                                        />
                                        <span>{status.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Progreso Pasos</p>
                        <h4 className="text-xl font-bold">{currentStep} / {totalSteps}</h4>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                        <ListChecks className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Requisitos Listos</p>
                        <h4 className="text-xl font-bold">{completedReqs} / {totalReqs} ({progress}%)</h4>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Fase Actual</p>
                        <h4 className="text-sm font-bold truncate max-w-[150px]">
                            {steps[currentStep]?.title || (currentStep >= totalSteps ? 'Finalizado' : 'Sin iniciar')}
                        </h4>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Estado Pago</p>
                        <h4 className="text-sm font-bold capitalize">
                            {paymentStatus === 'paid' ? 'Pagado' : paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}
                        </h4>
                    </div>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Timeline & Requirements & Documents (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="timeline">Línea de Tiempo ({totalSteps})</TabsTrigger>
                            <TabsTrigger value="requirements">Requisitos ({completedReqs}/{totalReqs})</TabsTrigger>
                            <TabsTrigger value="documents">Expediente ({procedureDocuments.length})</TabsTrigger>
                        </TabsList>

                        {/* TIMELINE CONTENT */}
                        <TabsContent value="timeline" className="mt-6 animate-in fade-in-50">
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
                                            {steps.map((step, index: number) => {
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
                                    {requirements.map((req, index: number) => {
                                        const reqId = typeof req === 'object' && req !== null && 'id' in req ? String(req.id) : String(req)
                                        const reqTitle = typeof req === 'object' && req !== null && 'title' in req ? String(req.title) : String(req)
                                        const isChecked = !!checklist[reqId]

                                        return (
                                            <div key={index} className={cn(
                                                "flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200",
                                                isChecked ? "bg-muted/30 border-transparent" : "bg-card hover:bg-muted/50"
                                            )}>
                                                <Checkbox
                                                    id={`req-${index}`}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => handleChecklistChange(reqId, !!checked)}
                                                    className="mt-0.5"
                                                />
                                                <div className="space-y-1 leading-none">
                                                    <Label
                                                        htmlFor={`req-${index}`}
                                                        className={cn(
                                                            "text-sm font-medium cursor-pointer",
                                                            isChecked && "line-through text-muted-foreground"
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

                        {/* DOCUMENTS EXPEDIENTE CONTENT */}
                        <TabsContent value="documents" className="mt-6 animate-in fade-in-50 space-y-6">
                            {/* Upload Area */}
                            {procedure.client && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Subir Documentos al Expediente</CardTitle>
                                        <CardDescription>
                                            Los documentos se asociarán automáticamente a este trámite y al cliente.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <SmartDropzone
                                            clientId={procedure.client.id}
                                            organizationId={procedure.organization_id}
                                            procedureId={procedureId}
                                            onUploadComplete={() => {
                                                refetchProcedureDocs()
                                                queryClient.invalidateQueries({
                                                    queryKey: ['client-documents', procedure.client?.id]
                                                })
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Linked Documents Grid */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center justify-between">
                                        <span>Documentos del Trámite ({procedureDocuments.length})</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isProcedureDocsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <DocumentGrid
                                            documents={procedureDocuments}
                                            clientId={procedure.client?.id || ''}
                                            customAction={{
                                                icon: Unlink2,
                                                label: "Desvincular del trámite",
                                                onClick: (doc) => unlinkDocumentMutation.mutate(doc.id)
                                            }}
                                        />
                                    )}
                                </CardContent>
                            </Card>

                            {/* Available Client Documents to Link */}
                            <div className="pt-4">
                                <h4 className="text-sm font-semibold mb-3">Otros documentos disponibles del cliente</h4>
                                {isClientDocsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <DocumentGrid
                                        documents={clientDocuments.filter((doc) => !procedureDocuments.some((pDoc) => pDoc.id === doc.id))}
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
                                    {procedure.client.phone ? (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                            <PhoneAction phone={procedure.client.phone} />
                                        </div>
                                    ) : null}
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        <span>{getPrimaryIdentificationNumber(procedure.client) || 'No ID'}</span>
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
                                    onValueChange={(val: 'pending' | 'partial' | 'paid') => handlePaymentChange(val)}
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
