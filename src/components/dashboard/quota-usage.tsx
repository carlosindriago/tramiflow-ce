'use client'

import { useLimits } from '@/hooks/use-limits'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Lock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
/* eslint-disable */
import { cn } from '@/lib/utils'

export function QuotaUsage() {
    const { limits, loading } = useLimits()

    if (loading || !limits) return null

    // Helper to render a resource bar
    const renderBar = (label: string, usage: typeof limits.clients) => {
        const percentage = Math.min(100, (usage.currentCount / usage.maxLimit) * 100)

        let colorClass = 'bg-primary'
        let statusIcon = null
        let showUpgrade = false

        if (usage.status === 'blocked') {
            colorClass = 'bg-destructive'
            statusIcon = <Lock className="h-3 w-3 text-destructive" />
            showUpgrade = true
        } else if (usage.status === 'grace') {
            colorClass = 'bg-orange-500'
            statusIcon = <ShieldCheck className="h-3 w-3 text-orange-500" />
            showUpgrade = true
        } else if (usage.status === 'warning') {
            colorClass = 'bg-yellow-500'
            statusIcon = <AlertTriangle className="h-3 w-3 text-yellow-500" />
            showUpgrade = true
        }

        // Unlimited check
        if (usage.maxLimit > 900000) {
            return null // Don't show unlimited resources
        }

        return (
            <div className="space-y-1 mb-4">
                <div className="flex justify-between text-xs">
                    <span className="font-medium flex items-center gap-1">
                        {label} {statusIcon}
                    </span>
                    <span className="text-muted-foreground">
                        {usage.currentCount} / {usage.maxLimit}
                        {usage.status === 'grace' && <span className="text-orange-500 ml-1">(+Grace)</span>}
                    </span>
                </div>
                <Progress value={percentage} className="h-2" indicatorClassName={colorClass} />

                {showUpgrade && (
                    <div className="mt-1">
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary underline" asChild>
                            <Link href="/settings/billing">
                                Mejorar Plan para aumentar límites
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        )
    }

    // Only show if at least one resource is not 'ok' or if we want to show usage explicitly
    // Requirement says "En el Dashboard o Sidebar". Let's assume it's always visible or when relevant.
    // Let's show it always if not unlimited.

    return (
        <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Uso del Plan</h3>

            {renderBar('Clientes', limits.clients)}
            {renderBar('Trámites', limits.procedures)}

            {/* Storage is currently mock, maybe skip or show if > 0 */}
            {/* {renderBar('Almacenamiento', limits.storage)} */}

            {limits.planCode === 'free' && (
                <div className="mt-4 pt-3 border-t">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md transition-all duration-300 transform hover:scale-[1.02]" size="sm" asChild>
                        <Link href="/settings/billing">
                            🚀 Actualizar a PRO
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
