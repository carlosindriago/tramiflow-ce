'use client'

import React from 'react'
import { Sparkles, ShieldCheck, ArrowUpRight, KeyRound } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Badge } from '@carlosindriago/ui'

interface UpgradeUpsellProps {
    featureName?: string
    description?: string
    className?: string
}

export function UpgradeUpsell({
    featureName = 'esta funcionalidad',
    description = 'Desbloquea automatizaciones avanzadas, reportes ejecutivos, marca personalizada y soporte prioritario con TramiFlow Enterprise.',
    className,
}: UpgradeUpsellProps) {
    return (
        <Card className={`relative overflow-hidden border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-background to-background ${className || ''}`}>
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
            
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs py-0.5">
                        <Sparkles className="h-3 w-3" />
                        Enterprise Edition
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                        <KeyRound className="h-3 w-3" />
                        TRAMIFLOW_LICENSE_KEY
                    </span>
                </div>
                <CardTitle className="text-lg font-bold text-foreground mt-2">
                    Disponible en TramiFlow Pro / Enterprise
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {description}
                </CardDescription>
            </CardHeader>

            <CardContent className="pb-3 text-xs space-y-2">
                <div className="p-3 rounded-lg bg-muted/60 border border-border/80 flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                        Para activar <span className="font-semibold text-foreground">{featureName}</span> en este despliegue, configura tu variable de entorno <code className="px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]">TRAMIFLOW_LICENSE_KEY=tf_pro_...</code> en tu servidor o panel de Vercel.
                    </p>
                </div>
            </CardContent>

            <CardFooter className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/20">
                <span className="text-[11px] text-muted-foreground">
                    ¿Necesitas una licencia comercial?
                </span>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs font-medium" asChild>
                    <a href="https://tramiflow.com/enterprise" target="_blank" rel="noopener noreferrer">
                        Obtener Licencia Enterprise
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    )
}
