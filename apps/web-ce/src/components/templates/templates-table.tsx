// @ts-nocheck
'use client'

import * as React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    MoreVertical,
    Pencil,
    Copy,
    Trash2,
    ArrowUpDown,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

import { Button } from '@carlosindriago/ui'
import { Badge } from '@carlosindriago/ui'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@carlosindriago/ui'
import { Checkbox } from '@carlosindriago/ui'
import { DataTable } from '@carlosindriago/ui'
import { ConfirmDialog } from '@carlosindriago/ui'
import { SkeletonList } from '@carlosindriago/ui'
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

interface TemplatesTableProps {
    templates: Template[]
    isLoading?: boolean
}

/**
 * Templates Table Component
 *
 * Features:
 * - Advanced DataTable with sorting, filtering, pagination
 * - Skeleton loading state
 * - Confirmation dialog for delete
 * - Actions (edit, duplicate, delete)
 */
export function TemplatesTable({ templates, isLoading }: TemplatesTableProps) {
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    const [templateToDelete, setTemplateToDelete] = React.useState<string | null>(null)

    const handleDelete = async () => {
        if (!templateToDelete) return

        try {
            await deleteTemplate(templateToDelete)
            toast.success('Plantilla eliminada')
            // Refresh the page
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

    // Loading state
    if (isLoading) {
        return <SkeletonList rows={5} columns={6} asTableRows />
    }

    // Define columns
    const columns: ColumnDef<Template>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="h-8 px-2 hover:bg-transparent"
                    >
                        Nombre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <Link
                    href={`/templates/${row.original.id}`}
                    className="font-medium hover:text-primary transition-colors"
                >
                    {row.getValue('name')}
                </Link>
            ),
        },
        {
            accessorKey: 'category',
            header: 'Categoría',
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.getValue('category') || 'Sin categoría'}
                </Badge>
            ),
        },
        {
            id: 'total_cost',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="h-8 px-2 hover:bg-transparent"
                    >
                        Costo
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const template = row.original
                const total = template.fees_professional + template.fees_official
                return `${template.currency} ${total}`
            },
        },
        {
            id: 'total_days',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="h-8 px-2 hover:bg-transparent"
                    >
                        Días
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const template = row.original
                const total = template.duration_work + template.duration_resolution
                return `${total} días`
            },
        },
        {
            accessorKey: 'steps',
            header: 'Etapas',
            cell: ({ row }) => {
                const steps = row.original.steps
                return `${Array.isArray(steps) ? steps.length : 0} pasos`
            },
        },
        {
            accessorKey: 'is_active',
            header: 'Estado',
            cell: ({ row }) => (
                <Badge
                    variant={row.getValue('is_active') ? 'default' : 'secondary'}
                    className={
                        row.getValue('is_active')
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : ''
                    }
                >
                    {row.getValue('is_active') ? 'Activo' : 'Borrador'}
                </Badge>
            ),
        },
        {
            accessorKey: 'created_at',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="h-8 px-2 hover:bg-transparent"
                    >
                        Creado
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = new Date(row.getValue('created_at'))
                return format(date, 'dd/MM/yyyy', { locale: es })
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => {
                const template = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-elevation-1 border-border-standard">
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href={`/templates/${template.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDuplicate(template.id)}
                                className="cursor-pointer"
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    setTemplateToDelete(template.id)
                                    setShowDeleteDialog(true)
                                }}
                                className="cursor-pointer text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    return (
        <>
            <DataTable
                columns={columns}
                data={templates}
                searchKey="name"
                searchPlaceholder="Buscar por nombre..."
            />

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
        </>
    )
}
