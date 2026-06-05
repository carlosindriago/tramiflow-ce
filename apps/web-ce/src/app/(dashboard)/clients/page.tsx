// @ts-nocheck
'use client'

import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
    Plus,
    User,
    Phone,
    Mail,
    FileText,
    Eye,
    LayoutGrid,
    Table,
    Trash2,
    MoreVertical,
} from 'lucide-react'

import { Button } from '@tramiflow/ui'
import { Badge } from '@tramiflow/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tramiflow/ui'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@tramiflow/ui'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@tramiflow/ui'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@tramiflow/ui'
import { ConfirmDialog } from '@tramiflow/ui'
import { AnimatedSuccessModal } from '@tramiflow/ui'
import { useFormSuccess } from '@/hooks/use-form-success'
import { SkeletonCard } from '@tramiflow/ui'
import { toast } from '@tramiflow/core'
import { PhoneAction } from '@tramiflow/ui'
import { ClientForm } from '@/components/clients/client-form'

import { getClients, deleteClientAction } from './actions'
import { type Client, getPrimaryIdentificationNumber } from '@tramiflow/core'

type ViewMode = 'grid' | 'table'

export default function ClientsPage() {
    const [open, setOpen] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
    const queryClient = useQueryClient()
    const { isModalOpen, setIsModalOpen, handleSuccess } = useFormSuccess()

    // Fetch clients
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: getClients,
    })

// Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const result = await deleteClientAction(clientId)
      if (!result.success) throw new Error(result.error?._form?.[0] || 'Error al eliminar')
      return result
    },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            setShowDeleteDialog(false)
            setClientToDelete(null)
            toast.success('Cliente eliminado')
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()

    // Loading State
    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
                        <p className="text-muted-foreground">
                            Gestiona los clientes de tu organización.
                        </p>
                    </div>
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4" />
                        Nuevo Cliente
                    </Button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">
                        Gestiona los clientes de tu organización.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="h-4 w-4" />
                            Nuevo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="sr-only">Nuevo Cliente</DialogTitle>
                            <DialogDescription className="sr-only">
                                Añade un nuevo cliente a tu organización
                            </DialogDescription>
                        </DialogHeader>
                        <ClientForm
                            onSuccess={() => {
                                setOpen(false)
                                queryClient.invalidateQueries({ queryKey: ['clients'] })
                                handleSuccess()
                            }}
                            onCancel={() => setOpen(false)}
                            isDialog={true}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* View Toggle + Grid/Table */}
            {clients && clients.length > 0 && (
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                    <div className="flex items-center justify-between">
                        <TabsList className="bg-muted/20 border-border-standard">
                            <TabsTrigger value="grid" className="gap-2 data-[state=active]:bg-background">
                                <LayoutGrid className="h-4 w-4" />
                                Grid
                            </TabsTrigger>
                            <TabsTrigger value="table" className="gap-2 data-[state=active]:bg-background">
                                <Table className="h-4 w-4" />
                                Tabla
                            </TabsTrigger>
                        </TabsList>
                        <p className="text-sm text-muted-foreground">
                            {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
                        </p>
                    </div>

                    {/* Grid View */}
                    <TabsContent value="grid" className="mt-6">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {clients.map((client: Client) => (
                                <Card
                                    key={client.id}
                                    className="group relative flex flex-col transition-all hover:border-emerald-500/50 hover:shadow-lg border-border-standard bg-elevation-1 overflow-hidden"
                                >
                                    {/* Header */}
                                    <CardHeader className="pb-4 border-b border-border-standard">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                    {getInitials(client.full_name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <CardTitle className="line-clamp-1 text-lg leading-tight">
                                                        {client.full_name}
                                                    </CardTitle>
                                                    {client.nationality && (
                                                        <Badge variant="outline" className="mt-1 border-border-standard text-xs">
                                                            {client.nationality}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted/50"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">Abrir menú</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-elevation-1 border-border-standard">
                                                    <DropdownMenuItem asChild className="cursor-pointer">
                                                        <Link href={`/clients/${client.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Ver Perfil
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setClientToDelete(client)
                                                            setShowDeleteDialog(true)
                                                        }}
                                                        className="cursor-pointer text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>

                                    {/* Content with contact info */}
                                    <CardContent className="flex-1 py-6 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-lg border border-border-standard bg-emerald-50/50 dark:bg-emerald-950/10 p-3">
                                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-1">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="text-xs font-medium uppercase tracking-wide">Documento</span>
                                                </div>
                                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 truncate">
                                                     {getPrimaryIdentificationNumber(client) || '—'}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-border-standard bg-blue-50/50 dark:bg-blue-950/10 p-3 overflow-hidden">
                                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1">
                                                    <Phone className="h-4 w-4" />
                                                    <span className="text-xs font-medium uppercase tracking-wide">Teléfono</span>
                                                </div>
                                                {client.phone ? (
                                                    <PhoneAction phone={client.phone} variant="compact" className="-ml-2 text-blue-900 dark:text-blue-100 font-bold" />
                                                ) : (
                                                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">—</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate">
                                                    {client.email || 'Sin email'}
                                                </p>
                                                {client.notes && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {client.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Footer with CTA */}
                                    <CardFooter className="pt-4 border-t border-border-standard bg-muted/20">
                                        <Button
                                            asChild
                                            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all"
                                        >
                                            <Link href={`/clients/${client.id}`}>
                                                <Eye className="h-4 w-4" />
                                                Ver Perfil
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Table View */}
                    <TabsContent value="table" className="mt-6">
                        <div className="rounded-xl border border-border-standard bg-elevation-1 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border-standard text-left text-xs uppercase text-muted-foreground">
                                            <th className="px-4 py-3 font-medium">Cliente</th>
                                            <th className="px-4 py-3 font-medium">DNI / Pasaporte</th>
                                            <th className="px-4 py-3 font-medium">Teléfono</th>
                                            <th className="px-4 py-3 font-medium">Email</th>
                                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map((client: Client) => (
                                            <tr
                                                key={client.id}
                                                className="border-b border-border-standard last:border-0 hover:bg-muted/50 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                            {getInitials(client.full_name)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{client.full_name}</p>
                                                            {client.nationality && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {client.nationality}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4" />
                                                         {getPrimaryIdentificationNumber(client) || '—'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {client.phone ? (
                                                        <PhoneAction phone={client.phone} />
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4" />
                                                            —
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {client.email || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/clients/${client.id}`}>
                                                            <Button variant="ghost" size="sm" className="gap-2 hover:text-emerald-600">
                                                                <Eye className="h-4 w-4" />
                                                                Ver
                                                            </Button>
                                                        </Link>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-elevation-1 border-border-standard">
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setClientToDelete(client)
                                                                        setShowDeleteDialog(true)
                                                                    }}
                                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Eliminar
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            )}

            {/* Empty State */}
            {!isLoading && clients?.length === 0 && (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border-standard text-center">
                    <div className="mb-4 rounded-full bg-muted p-4">
                        <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                        No hay clientes registrados
                    </h3>
                    <p className="mb-4 max-w-sm text-muted-foreground">
                        Agrega tu primer cliente para empezar a gestionar sus trámites
                        y documentos.
                    </p>
                    <Button
                        onClick={() => setOpen(true)}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Crear Primer Cliente
                    </Button>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar cliente?"
                description={`Esta acción no se puede deshacer. Se eliminarán todos los datos y documentos asociados a ${clientToDelete?.full_name || 'este cliente'}.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
                isLoading={deleteMutation.isPending}
                onConfirm={() => { if (clientToDelete) deleteMutation.mutate(clientToDelete.id) }}
            />

            {/* Success Modal */}
            <AnimatedSuccessModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                redirectPath="/clients"
                title="¡Cliente Creado!"
                message="El cliente se ha registrado correctamente"
                redirectInfo="Actualizando listado..."
                buttonLabel="Ir Ahora"
                variant="emerald"
                autoRedirectDelay={2000}
            />
        </div>
    )
}
