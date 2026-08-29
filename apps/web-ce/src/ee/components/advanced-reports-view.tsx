'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@carlosindriago/ui'
import { BarChart3, TrendingUp, Users2, FileCheck2 } from 'lucide-react'

export function AdvancedReportsView() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Reportes Avanzados & KPIs</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Métricas de rendimiento de expedientes, conversión de clientes y tiempos promedio de respuesta.
                    </p>
                </div>
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                    Enterprise
                </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Tasa de Cierre</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">84.2%</div>
                        <p className="text-[11px] text-muted-foreground mt-1">+12% vs mes anterior</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Tiempo Promedio Trámite</CardTitle>
                        <FileCheck2 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.8 días</div>
                        <p className="text-[11px] text-muted-foreground mt-1">-1.5 días de optimización</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Retención de Clientes</CardTitle>
                        <Users2 className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">96.5%</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Fidelización alta</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Productividad del Equipo</CardTitle>
                        <BarChart3 className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98/100</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Nivel sobresaliente</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
