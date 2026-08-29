'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    User,
    Phone,
    Mail,
    FileText,
    ArrowLeft,
    Calendar,
    Globe,
    CreditCard,
    Edit2,
} from 'lucide-react'
import Link from 'next/link'
import { PhoneAction } from '@carlosindriago/ui'

import { Button } from '@carlosindriago/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@carlosindriago/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@carlosindriago/ui'
import { Badge } from '@carlosindriago/ui'
import { Skeleton } from '@carlosindriago/ui'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@carlosindriago/ui'

import { SmartDropzone } from '@/components/documents/smart-dropzone'
import { DocumentGrid } from '@/components/documents/document-grid'
import { ProcedureCard } from '@/components/procedures/procedure-card'
import { NewProcedureDialog } from '@/components/procedures/new-procedure-dialog'
import { NewDocumentDialog } from '@/components/document-builder/new-document-dialog'
import { ClientForm } from '@/components/clients/client-form'
import { Plus, Sparkles, ExternalLink } from 'lucide-react'

// Removed server action imports for client data fetching to avoid 500 render errors
import type { Client } from '@carlosindriago/core'
import { getPrimaryIdentificationNumber } from '@carlosindriago/core'
import type { Document } from '@carlosindriago/core'
import type { Procedure } from '@carlosindriago/core'

interface ClientProfileProps {
    clientId: string
}

export default function ClientProfile({ clientId }: ClientProfileProps) {
    const [isNewProcedureOpen, setIsNewProcedureOpen] = useState(false)
    const [isNewDocOpen, setIsNewDocOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const queryClient = useQueryClient()

    // Fetch client data via REST API
    const {
        data: client,
        isLoading: clientLoading,
    } = useQuery<Client | null>({
        queryKey: ['client', clientId],
        queryFn: async () => {
            const res = await fetch(`/api/clients/${clientId}`)
            const json = await res.json()
            return json.success ? json.data : null
        },
    })

    // Fetch uploaded documents via REST API
    const {
        data: documents = [],
        isLoading: docsLoading,
        refetch: refetchDocs,
    } = useQuery<Document[]>({
        queryKey: ['documents', clientId],
        queryFn: async () => {
            const res = await fetch(`/api/clients/${clientId}/documents`)
            const json = await res.json()
            return json.success ? json.data : []
        },
    })

    // Fetch generated documents via REST API
    const {
        data: generatedDocs = [],
        isLoading: genDocsLoading,
        refetch: refetchGenDocs,
    } = useQuery<{ id: string; title: string; created_at: string; template?: { id: string; title: string } }[]>({
        queryKey: ['client-generated-documents', clientId],
        queryFn: async () => {
            const res = await fetch(`/api/clients/${clientId}/generated-documents`)
            const json = await res.json()
            return json.success ? json.data : []
        },
    })

    // Fetch procedures via REST API
    const { data: procedures = [], refetch: refetchProcedures } = useQuery<Procedure[]>({
        queryKey: ['procedures', clientId],
        queryFn: async () => {
            const res = await fetch(`/api/clients/${clientId}/procedures`)
            const json = await res.json()
            return json.success ? (json.data as unknown as Procedure[]) : []
        },
    })

    // Fetch templates via REST API
    const { data: templates = [] } = useQuery({
        queryKey: ['procedure-templates'],
        queryFn: async () => {
            const res = await fetch('/api/templates')
            const json = await res.json()
            return json.success ? json.data : []
        },
    })

    if (clientLoading) {
        return <ClientProfileSkeleton />
    }

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <User className="h-12 w-12 text-muted-foreground/40" />
                <h2 className="mt-4 text-lg font-medium">Cliente no encontrado</h2>
                <p className="text-sm text-muted-foreground">
                    El cliente solicitado no existe o no tienes acceso.
                </p>
                <Link href="/clients">
                    <Button variant="outline" className="mt-4 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Clientes
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/clients">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
<h1 className="text-2xl font-bold tracking-tight">
              {client.full_name}
            </h1>
            {getPrimaryIdentificationNumber(client) && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                {getPrimaryIdentificationNumber(client)}
              </p>
            )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                        variant="outline"
                        onClick={() => setIsEditOpen(true)}
                        className="gap-2"
                    >
                        <Edit2 className="h-4 w-4" />
                        Editar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsNewDocOpen(true)}
                        className="gap-2 border-emerald-600/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    >
                        <FileText className="h-4 w-4" />
                        Nuevo Documento
                    </Button>
                    <Button
                        onClick={() => setIsNewProcedureOpen(true)}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Trámite
                    </Button>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Activo
                    </Badge>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                    </DialogHeader>
                    <ClientForm
                        clientId={client.id}
                        defaultValues={{
                            full_name: client.full_name,
                            identifications: (client.identifications as { type: string; number: string; }[]) || [{ type: 'DNI', number: '' }],
                            nationality: client.nationality || '',
                            phone: client.phone || '',
                            email: client.email || '',
                            notes: client.notes || '',
                        }}
                        isDialog={true}
                        onCancel={() => setIsEditOpen(false)}
                        onSuccess={() => {
                            setIsEditOpen(false)
                            queryClient.invalidateQueries({ queryKey: ['client', clientId] })
                            queryClient.invalidateQueries({ queryKey: ['clients'] })
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Tabs */}
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-[650px]">
                    <TabsTrigger value="info" className="gap-2">
                        <User className="h-4 w-4" />
                        Información
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Archivos
                        {documents.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                                {documents.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="generated_docs" className="gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        Docs Generados
                        {generatedDocs.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                                {generatedDocs.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="procedures" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Trámites
                    </TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="mt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="h-4 w-4 text-primary" />
                                    Datos Personales
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <InfoRow
                                    icon={User}
                                    label="Nombre Completo"
                                    value={client.full_name}
                                />
                                <InfoRow
                                    icon={CreditCard}
                                    label="Documento"
                                    value={getPrimaryIdentificationNumber(client) || 'No registrado'}
                                />
                                <InfoRow
                                    icon={Globe}
                                    label="Nacionalidad"
                                    value={client.nationality || 'No especificada'}
                                />
                                <InfoRow
                                    icon={Calendar}
                                    label="Registrado"
                                    value={new Date(client.created_at ?? '').toLocaleDateString('es-PE', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Phone className="h-4 w-4 text-primary" />
                                    Contacto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Teléfono</p>
                                        {client.phone ? (
                                            <PhoneAction phone={client.phone} className="-ml-2 mt-0.5" />
                                        ) : (
                                            <p className="text-sm font-medium">No registrado</p>
                                        )}
                                    </div>
                                </div>
                                <InfoRow
                                    icon={Mail}
                                    label="Email"
                                    value={client.email || 'No registrado'}
                                />
                            </CardContent>
                        </Card>

                        {client.notes && (
                            <Card className="sm:col-span-2">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Notas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {client.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Uploaded Documents Tab */}
                <TabsContent value="documents" className="mt-6 space-y-6">
                    <SmartDropzone
                        clientId={clientId}
                        organizationId={client.organization_id}
                        onUploadComplete={() => refetchDocs()}
                    />

                    {docsLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-8 w-32" />
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-48 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <DocumentGrid
                            documents={documents}
                            clientId={clientId}
                            onDelete={() => refetchDocs()}
                        />
                    )}
                </TabsContent>

                {/* Generated Documents Tab */}
                <TabsContent value="generated_docs" className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Documentos Generados</h3>
                            <p className="text-xs text-muted-foreground">Documentos redactados a partir de plantillas para este cliente.</p>
                        </div>
                        <Button
                            onClick={() => setIsNewDocOpen(true)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Generar Documento
                        </Button>
                    </div>

                    {genDocsLoading ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2].map(i => (
                                <Skeleton key={i} className="h-32 rounded-xl" />
                            ))}
                        </div>
                    ) : generatedDocs.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-card">
                            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm font-medium text-foreground">No hay documentos generados para este cliente</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                Puedes generar contratos, cartas o solicitudes oficiales autocompletando los datos del cliente.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4 gap-2 border-emerald-600/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50"
                                onClick={() => setIsNewDocOpen(true)}
                            >
                                <Sparkles className="h-4 w-4" />
                                Generar Primer Documento
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {generatedDocs.map(doc => (
                                <Card key={doc.id} className="p-4 hover:border-emerald-500/50 transition-all bg-card">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <Link href={`/documents/review/${doc.id}`} className="shrink-0">
                                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1 hover:text-emerald-600">
                                                Revisar
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                    <div className="mt-3">
                                        <h4 className="font-semibold text-sm line-clamp-1 text-foreground">{doc.title}</h4>
                                        {doc.template?.title && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Plantilla: {doc.template.title}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-muted-foreground/70 mt-2">
                                            {new Date(doc.created_at).toLocaleDateString('es-PE', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Procedures Tab */}
                <TabsContent value="procedures" className="mt-6">
                    {procedures.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl">
                            <p className="text-muted-foreground">Este cliente no tiene trámites activos.</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setIsNewProcedureOpen(true)}
                            >
                                Iniciar Nuevo Trámite
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-4 flex justify-end">
                                <Button onClick={() => setIsNewProcedureOpen(true)}>
                                    Nuevo Trámite
                                </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {procedures.map((proc) => (
                                    <ProcedureCard
                                        key={proc.id}
                                        procedure={proc}
                                        hideClient={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <NewProcedureDialog
                open={isNewProcedureOpen}
                onOpenChange={setIsNewProcedureOpen}
                clients={client ? [{ id: client.id, full_name: client.full_name }] : []}
                templates={templates as { id: string, name: string }[]}
                defaultClientId={clientId}
                onProcedureCreated={() => refetchProcedures()}
            />

            <NewDocumentDialog
                open={isNewDocOpen}
                onOpenChange={setIsNewDocOpen}
                defaultClientId={clientId}
                onDocumentCreated={() => refetchGenDocs()}
            />
        </div>
    )
}

// Helper component
function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    )
}

// Skeleton loader
function ClientProfileSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="mt-1.5 h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-10 w-64" />
            <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-52 rounded-xl" />
                <Skeleton className="h-52 rounded-xl" />
            </div>
        </div>
    )
}
