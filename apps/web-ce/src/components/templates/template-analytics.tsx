'use client'

import { useState, useEffect } from 'react'
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { Eye, Users, TrendingUp, MessageCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@carlosindriago/ui'
import { Button } from '@carlosindriago/ui'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@carlosindriago/ui'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@carlosindriago/ui'
import { ScrollArea } from '@carlosindriago/ui'
import { getTemplateAnalytics, getTemplateClones } from '@/actions/growth'
import type { TemplateAnalytics, RecentLead, TemplateClone } from '@carlosindriago/core'

interface TemplateAnalyticsProps {
    templateId: string
}

export function TemplateAnalytics({ templateId }: TemplateAnalyticsProps) {
    const [data, setData] = useState<TemplateAnalytics | null>(null)
    const [loading, setLoading] = useState(true)

    // Clones Modal State
    const [allClones, setAllClones] = useState<TemplateClone[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const loadMoreClones = async () => {
        setLoadingMore(true)
        const nextPage = page + 1
        const res = await getTemplateClones(templateId, nextPage, 10)

        if (res.success && res.data) {
            setAllClones(prev => [...prev, ...res.data])
            setPage(nextPage)
            if (res.data.length < 10) setHasMore(false)
        } else {
            setHasMore(false)
        }
        setLoadingMore(false)
    }

    useEffect(() => {
        getTemplateAnalytics(templateId).then((res) => {
            if (res.success && res.data) {
                setData(res.data)
                // Initialize clones list with the top 10 returned
                setAllClones(res.data.clones || [])
                if ((res.data.clones?.length || 0) < 10) setHasMore(false)
            }
            setLoading(false)
        })
    }, [templateId])

    if (loading) return <div>Cargando analíticas...</div>
    if (!data) return <div>No hay datos disponibles</div>

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vistas</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalViews}</div>
                        <p className="text-xs text-muted-foreground">
                            Página pública compartida
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalLeads}</div>
                        <p className="text-xs text-muted-foreground">
                            Interesados registrados
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.conversionRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Leads / Vistas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Rendimiento (Últimos 30 días)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.chartData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    labelStyle={{ color: '#1e293b' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorViews)"
                                    name="Vistas"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="leads"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorLeads)"
                                    name="Leads"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Leads Table */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Leads Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.recentLeads?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No hay leads registrados aún.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.recentLeads?.map((lead: RecentLead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-medium">{lead.name}</TableCell>
                                            <TableCell>{lead.phone}</TableCell>
                                            <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                                                    <a
                                                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <MessageCircle className="h-4 w-4 text-emerald-500" />
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Clones Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Quién ha copiado esta plantilla</CardTitle>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={!data.clones || data.clones.length === 0}>
                                    Ver todos
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>Historial de Copias</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-[400px] rounded-md border p-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Organización</TableHead>
                                                <TableHead>País</TableHead>
                                                <TableHead>Fecha</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allClones.map((clone) => (
                                                <TableRow key={clone.id}>
                                                    <TableCell className="font-medium">{clone.organization_name}</TableCell>
                                                    <TableCell>{clone.country || 'Desconocido'}</TableCell>
                                                    <TableCell>
                                                        {new Date(clone.created_at).toLocaleDateString()} {new Date(clone.created_at).toLocaleTimeString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {allClones.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-4">
                                                        No hay datos.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    {hasMore && (
                                        <div className="mt-4 flex justify-center">
                                            <Button
                                                variant="outline"
                                                onClick={loadMoreClones}
                                                disabled={loadingMore}
                                            >
                                                {loadingMore ? 'Cargando...' : 'Cargar más'}
                                            </Button>
                                        </div>
                                    )}
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organización</TableHead>
                                    <TableHead>País</TableHead>
                                    <TableHead>Fecha</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.clones?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                            Nadie ha copiado esta plantilla aún.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.clones?.slice(0, 10).map((clone: TemplateClone) => (
                                        <TableRow key={clone.id}>
                                            <TableCell className="font-medium">{clone.organization_name}</TableCell>
                                            <TableCell>{clone.country || 'Desconocido'}</TableCell>
                                            <TableCell>{new Date(clone.created_at).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
