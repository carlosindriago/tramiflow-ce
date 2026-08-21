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

import { Button } from '@carlosindriago/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@carlosindriago/ui'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@carlosindriago/ui'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@carlosindriago/ui'
import { Badge } from '@carlosindriago/ui'
import { SkeletonCard } from '@carlosindriago/ui'
import { TemplatesTable } from './templates-table'
import { ConfirmDialog } from '@carlosindriago/ui'
import { deleteTemplate, duplicateTemplate } from '@/app/(dashboard)/templates/new/actions'
import { toast } from '@carlosindriago/core'

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
            const res = await deleteTemplate(templateToDelete)
            if (res.success) {
                toast.success('Plantilla eliminada')
                window.location.reload()
            } else {
                toast.error(res.error || 'Error al eliminar la plantilla')
            }
        } catch (error) {
            console.error('Delete template error:', error)
            toast.error('Error al eliminar la plantilla')
        }
    }

    const handleDuplicate = async (templateId: string) => {
        try {
            const res = await duplicateTemplate(templateId)
            if (res && !res.success) {
                toast.error(res.error || 'Error al duplicar la plantilla')
            }
        } catch (error) {
            console.error('Duplicate template error:', error)
            toast.error('Error al duplicar la plantilla')
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-8 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Plantillas</h1>
                        <p className="text-muted-foreground">
                            Gestiona los flujos de trabajo de tus trámites.
                        </p>
                    </div>
                    <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Plantillas</h1>
                    <p className="text-muted-foreground">
                        Gestiona los flujos de trabajo de tus trámites.
                    </p>
                </div>
                <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
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
                        <TabsList className="bg-muted/40 border-border">
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
                                    className="group relative flex flex-col transition-all duration-300 hover:scale-[1.01] hover:shadow-xl border-border bg-card shadow-sm overflow-hidden"
                                >
                                    {/* Header with status badge */}
                                    <CardHeader className="pb-4 border-b border-border">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge
                                                        variant={template.is_active ? 'default' : 'secondary'}
                                                        className={template.is_active
                                                            ? 'bg-primary/10 text-primary border-primary/20'
                                                            : 'bg-muted text-muted-foreground border-border'
                                                        }
                                                    >
                                                        {template.is_active ? 'Activo' : 'Borrador'}
                                                    </Badge>
                                                    {template.category && (
                                                        <Badge variant="outline" className="border-border text-muted-foreground">
                                                            {template.category}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardTitle className="line-clamp-2 text-xl leading-tight text-foreground group-hover:text-primary transition-colors">
                                                    {template.name}
                                                </CardTitle>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">Abrir menú</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-popover border-border">
                                                    <DropdownMenuItem asChild className="cursor-pointer text-popover-foreground focus:bg-muted">
                                                        <Link href={`/templates/${template.id}/edit`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDuplicate(template.id)}
                                                        className="cursor-pointer text-popover-foreground focus:bg-muted"
                                                    >
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Duplicar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border" />
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setTemplateToDelete(template.id)
                                                            setShowDeleteDialog(true)
                                                        }}
                                                        className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
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
                                            <div className="rounded-lg border border-border bg-muted/40 p-3">
                                                <div className="flex items-center gap-2 text-primary mb-1">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span className="text-xs font-medium uppercase tracking-wide">Costo Total</span>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">
                                                    {template.currency} {template.fees_professional + template.fees_official}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-border bg-muted/40 p-3">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-xs font-medium uppercase tracking-wide">Duración</span>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">
                                                    {template.duration_work + template.duration_resolution} días
                                                </p>
                                            </div>
                                        </div>

                                        {/* Steps indicator */}
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                                <FileText className="h-4 w-4 text-foreground" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">
                                                    {Array.isArray(template.steps)
                                                        ? template.steps.length
                                                        : 0}{' '}
                                                    {Array.isArray(template.steps) && template.steps.length === 1 ? 'etapa' : 'etapas'} definidas
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Última edición: {format(new Date(template.created_at), 'dd MMM, yyyy', { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Footer with CTA button */}
                                    <CardFooter className="pt-4 border-t border-border bg-muted/20">
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full gap-2 border-border hover:bg-muted font-medium text-foreground"
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
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                    <div className="mb-4 rounded-full bg-muted p-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                        No hay plantillas creadas
                    </h3>
                    <p className="mb-4 max-w-sm text-muted-foreground">
                        Crea tu primera plantilla para estandarizar los procesos de tus
                        trámites y ahorrar tiempo.
                    </p>
                    <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
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
