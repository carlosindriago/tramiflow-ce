// @ts-nocheck
'use client'

import * as React from 'react'
import Link from 'next/link'
import {
    Plus,
    MoreVertical,
    Pencil,
    Copy,
    Trash2,
    Clock,
    DollarSign,
    FileText,
    LayoutGrid,
    Table,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@tramiflow/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tramiflow/ui'
import {
    Card,
    CardContent,
/* eslint-disable */
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@tramiflow/ui'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@tramiflow/ui'
import { Badge } from '@tramiflow/ui'
import { SkeletonCard } from '@tramiflow/ui'
import { TemplatesTable } from './templates-table'
import { ConfirmDialog } from '@tramiflow/ui'
import { deleteTemplate, duplicateTemplate } from '@/app/(dashboard)/templates/new/actions'
import { toast } from '@tramiflow/core'

// Types - matches database schema after domain refactor
interface Template {
    id: string
    name: string
    category: string | null
    fees_professional: number
    fees_official: number
    currency: string
    duration_work: number
    duration_resolution: number
    is_active: boolean
    steps: unknown[] | null
    created_at: string
}

interface TemplatesViewProps {
    templates: Template[]
    isLoading?: boolean
}

type ViewMode = 'grid' | 'table'

/**
 * Templates View Component
 *
 * Features:
 * - Toggle between Grid and Table views
 * - Grid view: Visual cards with details
 * - Table view: Advanced data table with sorting/filtering
 * - Skeleton loading for both views
 * - Confirm dialog for delete
 */
export function TemplatesView({ templates, isLoading }: TemplatesViewProps) {
    const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    const [templateToDelete, setTemplateToDelete] = React.useState<string | null>(null)

    const handleDelete = async () => {
        if (!templateToDelete) return

        try {
            await deleteTemplate(templateToDelete)
            toast.success('Plantilla eliminada')
            window.location.reload()
/* eslint-disable */
        } catch (error) {
            toast.error('Error al eliminar la plantilla')
        }
    }

    const handleDuplicate = async (templateId: string) => {
        try {
            await duplicateTemplate(templateId)
            toast.success('Plantilla duplicada')
            window.location.reload()
/* eslint-disable */
        } catch (error) {
            toast.error('Error al duplicar la plantilla')
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-8 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Plantillas</h1>
                        <p className="text-muted-foreground">
                            Gestiona los flujos de trabajo de tus trámites.
                        </p>
                    </div>
                    <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Link href="/templates/new">
                            <Plus className="h-4 w-4" />
                            Nueva Plantilla
                        </Link>
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
                    <h1 className="text-2xl font-bold tracking-tight">Plantillas</h1>
                    <p className="text-muted-foreground">
                        Gestiona los flujos de trabajo de tus trámites.
                    </p>
                </div>
                <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Link href="/templates/new">
                        <Plus className="h-4 w-4" />
                        Nueva Plantilla
                    </Link>
                </Button>
            </div>

            {/* View Toggle */}
            {templates && templates.length > 0 && (
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
                    </div>

                    {/* Grid View */}
                    <TabsContent value="grid" className="mt-6">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {templates.map((template) => (
                                <Card
                                    key={template.id}
                                    className="group relative flex flex-col transition-all duration-300 hover:scale-[1.01] hover:shadow-xl border-slate-800/50 bg-slate-900/40 backdrop-blur-md overflow-hidden"
                                >
                                    {/* Header with status badge */}
                                    <CardHeader className="pb-4 border-b border-slate-800/50">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge
                                                        variant={template.is_active ? 'default' : 'secondary'}
                                                        className={`${template.is_active
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-slate-800 text-slate-400 border-slate-700'
                                                            }`}
                                                    >
                                                        {template.is_active ? 'Activo' : 'Borrador'}
                                                    </Badge>
                                                    {template.category && (
                                                        <Badge variant="outline" className="border-slate-700 text-slate-400">
                                                            {template.category}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardTitle className="line-clamp-2 text-xl leading-tight text-slate-100 group-hover:text-emerald-400 transition-colors">
                                                    {template.name}
                                                </CardTitle>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/50"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">Abrir menú</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                                                    <DropdownMenuItem asChild className="cursor-pointer text-slate-300 focus:bg-slate-800 focus:text-white">
                                                        <Link href={`/templates/${template.id}/edit`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDuplicate(template.id)}
                                                        className="cursor-pointer text-slate-300 focus:bg-slate-800 focus:text-white"
                                                    >
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Duplicar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-800" />
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setTemplateToDelete(template.id)
                                                            setShowDeleteDialog(true)
                                                        }}
                                                        className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>

                                    {/* Content with stats */}
                                    <CardContent className="flex-1 py-6 space-y-4">
                                        {/* Fees and Duration - Highlighted */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-lg border border-slate-800/50 bg-slate-900/40 p-3">
                                                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span className="text-xs font-medium uppercase tracking-wide">Costo Total</span>
                                                </div>
                                                <p className="text-lg font-bold text-slate-200">
                                                    {template.currency} {template.fees_professional + template.fees_official}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-slate-800/50 bg-slate-900/40 p-3">
                                                <div className="flex items-center gap-2 text-blue-400 mb-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-xs font-medium uppercase tracking-wide">Duración</span>
                                                </div>
                                                <p className="text-lg font-bold text-slate-200">
                                                    {template.duration_work + template.duration_resolution} días
                                                </p>
                                            </div>
                                        </div>

                                        {/* Steps indicator */}
                                        <div className="flex items-center gap-3 text-sm text-slate-400">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/50">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-300">
                                                    {Array.isArray(template.steps)
                                                        ? template.steps.length
                                                        : 0}{' '}
                                                    {Array.isArray(template.steps) && template.steps.length === 1 ? 'etapa' : 'etapas'} definidas
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Última edición: {format(new Date(template.created_at), 'dd MMM, yyyy', { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Footer with CTA button */}
                                    <CardFooter className="pt-4 border-t border-slate-800/50 bg-slate-900/20">
                                        <Button
                                            asChild
                                            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transition-all font-medium"
                                        >
                                            <Link href={`/templates/${template.id}`}>
                                                <FileText className="h-4 w-4" />
                                                Ver Plantilla
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Table View */}
                    <TabsContent value="table" className="mt-6">
                        <TemplatesTable templates={templates || []} />
                    </TabsContent>
                </Tabs>
            )}

            {/* Empty State */}
            {templates?.length === 0 && (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border-standard text-center">
                    <div className="mb-4 rounded-full bg-muted p-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                        No hay plantillas creadas
                    </h3>
                    <p className="mb-4 max-w-sm text-muted-foreground">
                        Crea tu primera plantilla para estandarizar los procesos de tus
                        trámites y ahorrar tiempo.
                    </p>
                    <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Link href="/templates/new">
                            <Plus className="h-4 w-4" />
                            Crear Primera Plantilla
                        </Link>
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar plantilla?"
                description="Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a esta plantilla."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </div>
    )
}
