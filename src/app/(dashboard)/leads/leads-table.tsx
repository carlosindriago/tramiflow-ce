'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown, MessageCircle, UserPlus, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/ui/data-table/data-table'
import Link from 'next/link'

// Define the Lead type based on DB schema
export type Lead = {
    id: string
    name: string
    phone: string
    service_interest?: string
    status: 'new' | 'contacted' | 'converted' | 'archived'
    created_at: string
}

export const columns: ColumnDef<Lead>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Nombre
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'service_interest',
        header: 'Interés',
        cell: ({ row }) => {
            const interest = row.getValue('service_interest') as string
            const isGeneral = !interest || interest === 'Consulta General' || interest === 'Asesoría General'

            return (
                <Badge variant={isGeneral ? 'outline' : 'secondary'} className={isGeneral ? 'text-muted-foreground' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'}>
                    {interest || 'General'}
                </Badge>
            )
        },
    },
    {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
            const status = row.getValue('status') as string
            const map = {
                new: { label: 'Nuevo', color: 'bg-blue-500' },
                contacted: { label: 'Contactado', color: 'bg-yellow-500' },
                converted: { label: 'Convertido', color: 'bg-green-500' },
                archived: { label: 'Archivado', color: 'bg-gray-500' },
            }
            const s = map[status as keyof typeof map] || map.new

            return (
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${s.color}`} />
                    <span className="capitalize text-sm">{s.label}</span>
                </div>
            )
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Fecha
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'))
            return (
                <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="mr-2 h-3 w-3" />
                    {formatDistanceToNow(date, { addSuffix: true, locale: es })}
                </div>
            )
        },
    },
    {
        id: 'contact',
        header: 'Contacto',
        cell: ({ row }) => {
            const phone = row.original.phone
            const cleanPhone = phone.replace(/[^\d]/g, '')

            return (
                <Button variant="outline" size="sm" className="gap-2 h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" asChild>
                    <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                    </a>
                </Button>
            )
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const lead = row.original

            // Build conversion URL
            const params = new URLSearchParams()
            params.set('name', lead.name)
            params.set('phone', lead.phone)
            params.set('lead_id', lead.id)
            // Can add notes or interest if client form supports it

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(lead.phone)}
                        >
                            Copiar Teléfono
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild disabled={lead.status === 'converted'}>
                            <Link href={`/clients/new?${params.toString()}`} className="flex items-center cursor-pointer">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Convertir a Cliente
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

export function LeadsTable({ data }: { data: Lead[] }) {
    return (
        <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Buscar por nombre..." />
    )
}
