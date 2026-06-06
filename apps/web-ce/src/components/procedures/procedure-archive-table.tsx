'use client'

/* eslint-disable */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@carlosindriago/ui'
import { Badge } from '@carlosindriago/ui'
import { Button } from '@carlosindriago/ui'
import { Loader2 } from 'lucide-react'
import { getProceduresAction } from '@/app/(dashboard)/procedures/actions'
import { Procedure } from '@carlosindriago/core'
import Link from 'next/link'

export function ProcedureArchiveTable() {
    const { data: result, isLoading, error } = useQuery({
        queryKey: ['archived-procedures'],
        queryFn: async () => {
            const res = await getProceduresAction(true)
            return res.success ? (res.data as Procedure[]) : []
        }
    })

    const procedures = result || []

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 text-destructive bg-destructive/10 rounded-lg">
                Error cargando archivos: {error.message}
            </div>
        )
    }

    if (procedures.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>No hay trámites archivados</p>
                <p className="text-sm">Los trámites finalizados aparecerán aquí</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Trámite</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha de Inicio</TableHead>
                        <TableHead>Fecha de Cierre</TableHead>
                        <TableHead>Estado Final</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {procedures.map((procedure) => (
                        <TableRow key={procedure.id}>
                            <TableCell className="font-medium">
                                {procedure.title}
                            </TableCell>
                            <TableCell>
                                {procedure.client?.full_name || 'Sin cliente'}
                            </TableCell>
                            <TableCell>
                                {procedure.created_at 
                                    ? new Date(procedure.created_at).toLocaleDateString('es-PE')
                                    : '-'}
                            </TableCell>
                            <TableCell>
                                {procedure.updated_at 
                                    ? new Date(procedure.updated_at).toLocaleDateString('es-PE')
                                    : '-'}
                            </TableCell>
                            <TableCell>
                                <Badge 
                                    variant="outline"
                                    style={{ 
                                        backgroundColor: procedure.status_details?.color || '#666',
                                        color: 'white'
                                    }}
                                >
                                    {procedure.status_details?.name || 'Completado'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/procedures/${procedure.id}`}>
                                        Ver
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
