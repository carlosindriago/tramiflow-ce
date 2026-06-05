'use client'

/* eslint-disable */
import { useState, useEffect, useTransition } from 'react'
import { 
    AuditLog, 
    getAuditLogsAction, 
    getAuditUsersAction 
} from '@/app/(dashboard)/settings/audit/actions'
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@tramiflow/ui'
import { Button } from '@tramiflow/ui'
import { Input } from '@tramiflow/ui'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@tramiflow/ui'
import { Badge } from '@tramiflow/ui'
import { 
/* eslint-disable */
    Download, 
    Search, 
    Shield, 
/* eslint-disable */
    User, 
    Calendar, 
    History,
    FileDown,
    Loader2,
    Info,
/* eslint-disable */
    AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

export function AuditLogsView() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [users, setUsers] = useState<{id: string, full_name: string, email: string}[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isExporting, setIsExporting] = useState(false)
    const [page, setPage] = useState(1)
    const [totalCount, setCount] = useState(0)
    const [filters, setFilters] = useState({
        action: 'all',
        userId: 'all',
        search: ''
    })

    useEffect(() => {
        loadInitialData()
    }, [])

    useEffect(() => {
        fetchLogs()
/* eslint-disable */
    }, [page, filters.action, filters.userId])

    const loadInitialData = async () => {
        const usersData = await getAuditUsersAction()
/* eslint-disable */
        setUsers(usersData as any)
    }

    const fetchLogs = async () => {
        setIsLoading(true)
        const result = await getAuditLogsAction({
            page,
            pageSize: 15,
            action: filters.action,
            userId: filters.userId,
            search: filters.search
        })

        if (result.success && result.data) {
            setLogs(result.data)
            setCount(result.count)
        } else {
            toast.error(result.error || 'Error al cargar registros')
        }
        setIsLoading(false)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        fetchLogs()
    }

    const exportToCSV = () => {
        setIsExporting(true)
        try {
            // Simple CSV export from current view data
            // In a real app with many logs, this should be a server-side stream
            const headers = ['Fecha', 'Usuario', 'Acción', 'IP', 'Recurso', 'Detalles']
            const rows = logs.map(log => [
                format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
                log.user?.full_name || log.user?.email || 'Sistema',
                log.action,
                log.ip_address || '-',
                `${log.resource_type || ''} (${log.resource_id || ''})`,
                JSON.stringify(log.details)
            ])

            const csvContent = [
                headers.join(','),
                ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', `auditoria_tramiflow_${format(new Date(), 'yyyy-MM-dd')}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success('Reporte exportado correctamente')
/* eslint-disable */
        } catch (e) {
            toast.error('Error al exportar')
        } finally {
            setIsExporting(false)
        }
    }

    const getActionBadge = (action: string) => {
        const variants: Record<string, string> = {
            'DOCUMENT_DOWNLOADED': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            'DOCUMENT_DELETED': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
            'PROCEDURE_DELETED': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            'TEMPLATE_ARCHIVED': 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
            'MFA_ENABLED': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        }
        
        return (
            <Badge variant="outline" className={variants[action] || 'bg-slate-500/10 text-slate-600'}>
                {action.replace(/_/g, ' ')}
            </Badge>
        )
    }

    return (
        <div className="space-y-6">
            {/* Info Panel for Lawyers */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex gap-4 items-start">
                <div className="rounded-full bg-indigo-500/20 p-2 text-indigo-600 shrink-0">
                    <Shield className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">Registro de Cumplimiento e Integridad</h3>
                    <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80">
                        Estos registros son <strong>inmutables</strong> y sirven como prueba legal de quién accedió a la información. 
                        Es una herramienta fundamental para la transparencia y seguridad de tu estudio jurídico.
                    </p>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-card p-4 rounded-xl border">
                <div className="flex flex-wrap gap-4 items-end flex-1">
                    <div className="grid gap-2 w-full md:w-48">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acción</label>
                        <Select 
                            value={filters.action} 
                            onValueChange={(v) => { setFilters(prev => ({ ...prev, action: v })); setPage(1); }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todas las acciones" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="DOCUMENT_DOWNLOADED">Descarga de Doc</SelectItem>
                                <SelectItem value="DOCUMENT_DELETED">Borrado de Doc</SelectItem>
                                <SelectItem value="PROCEDURE_DELETED">Trámite Eliminado</SelectItem>
                                <SelectItem value="CLIENT_DELETED">Cliente Eliminado</SelectItem>
                                <SelectItem value="TEMPLATE_ARCHIVED">Plantilla Archivada</SelectItem>
                                <SelectItem value="MFA_ENABLED">MFA Activado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2 w-full md:w-48">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usuario</label>
                        <Select 
                            value={filters.userId} 
                            onValueChange={(v) => { setFilters(prev => ({ ...prev, userId: v })); setPage(1); }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los usuarios" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <form onSubmit={handleSearch} className="grid gap-2 w-full md:w-64">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar IP o Acción..."
                                className="pl-9"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                    </form>
                </div>

                <Button 
                    variant="outline" 
                    onClick={exportToCSV} 
                    disabled={isExporting || logs.length === 0}
                    className="gap-2"
                >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    Exportar Excel
                </Button>
            </div>

            {/* Logs Table */}
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[180px]">Fecha y Hora</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Acción Realizada</TableHead>
                            <TableHead>IP Origen</TableHead>
                            <TableHead className="text-right">Detalles</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="h-16 text-center">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : logs.length > 0 ? (
                            logs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium text-xs whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{log.user?.full_name || 'Sistema'}</span>
                                            <span className="text-xs text-muted-foreground">{log.user?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getActionBadge(log.action)}
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-muted-foreground">
                                            {log.ip_address || 'unknown'}
                                        </code>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            console.log(log.details)
                                            toast.info(`ID Recurso: ${log.resource_id || 'N/A'}`)
                                        }}>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <History className="h-8 w-8 opacity-20" />
                                        <p>No se encontraron registros de auditoría.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination UI */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Mostrando {logs.length} de {totalCount} registros
                </p>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Anterior
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        disabled={page * 15 >= totalCount}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    )
}
