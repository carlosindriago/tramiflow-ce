'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    User,
    Phone,
    Mail,
    FileText,
    ArrowLeft,
    Calendar,
    Globe,
    CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { PhoneAction } from '@/components/ui/phone-action'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { SmartDropzone } from '@/components/documents/smart-dropzone'
import { DocumentGrid } from '@/components/documents/document-grid'
import { ProcedureCard } from '@/components/procedures/procedure-card'
import { NewProcedureDialog } from '@/components/procedures/new-procedure-dialog'

import { getClientById, getClientDocuments, getClientProcedures } from './actions'
import { getTemplatesAction } from '@/app/(dashboard)/procedures/actions'
import type { Client } from '@/types/client'
import { getPrimaryIdentificationNumber } from '@/types/client'
import type { Document } from '@/types/document'
import type { Procedure } from '@/types/procedure'

interface ClientProfileProps {
    clientId: string
}

export default function ClientProfile({ clientId }: ClientProfileProps) {
    const [isNewProcedureOpen, setIsNewProcedureOpen] = useState(false)

    // Fetch client data
    const {
        data: client,
        isLoading: clientLoading,
    } = useQuery<Client | null>({
        queryKey: ['client', clientId],
        queryFn: () => getClientById(clientId),
    })

    // Fetch documents
    const {
        data: documents = [],
        isLoading: docsLoading,
        refetch: refetchDocs,
    } = useQuery<Document[]>({
        queryKey: ['documents', clientId],
        queryFn: () => getClientDocuments(clientId),
    })

    // Fetch procedures
    const { data: procedures = [], refetch: refetchProcedures } = useQuery<Procedure[]>({
        queryKey: ['procedures', clientId],
        queryFn: () => getClientProcedures(clientId) as Promise<Procedure[]>,
    })

    // Fetch templates for the dropdown
    const { data: templates = [] } = useQuery({
        queryKey: ['procedure-templates'],
        queryFn: () => getTemplatesAction().then(res => res.data || []),
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
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    Activo
                </Badge>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[500px]">
                    <TabsTrigger value="info" className="gap-2">
                        <User className="h-4 w-4" />
                        Información
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos
                        {documents.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                                {documents.length}
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

                {/* Documents Tab */}
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
