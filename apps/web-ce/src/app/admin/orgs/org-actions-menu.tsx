'use client'

/* eslint-disable */
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
/* eslint-disable */
import { MoreHorizontal, Crown, Timer, Ban, ChevronDown, TrendingDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@tramiflow/ui'
import { Button } from '@tramiflow/ui'
import { activatePro, extendTrial, banOrganization, downgradeToFree } from '../actions'
import type { AdminRole } from '@tramiflow/core'

interface OrgActionsMenuProps {
    orgId: string
    orgName: string
    adminRole: AdminRole
    orgStatus: string
    planTier: string
}

/* eslint-disable */
export function OrgActionsMenu({ orgId, orgName, adminRole, orgStatus, planTier }: OrgActionsMenuProps) {
    const [isPending, startTransition] = useTransition()
    const isSuperAdmin = adminRole === 'super_admin'

    function handleAction(
        action: (id: string) => Promise<{ success: boolean; message?: string; error?: string }>,
        label: string
    ) {
        startTransition(async () => {
            const result = await action(orgId)
            if (result.success) {
                toast.success(result.message ?? `${label} completado.`)
            } else {
                toast.error(result.error ?? `Error en ${label}.`)
            }
        })
    }

    return (
        <div className="flex items-center justify-end gap-2">
            {isSuperAdmin && planTier !== 'pro' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(activatePro, 'Activar PRO')}
                    disabled={isPending}
                    className="h-8 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 bg-transparent text-xs"
                >
                    <Crown className="h-3 w-3 mr-1.5" />
                    Hacer PRO
                </Button>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending} className="h-8 w-8 hover:bg-white/5 data-[state=open]:bg-white/5">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-xs text-muted-foreground truncate">
                        {orgName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Support + SuperAdmin */}
                    <DropdownMenuItem
                        onClick={() => handleAction(extendTrial, 'Extender Trial')}
                        className="gap-2 text-amber-400 focus:text-amber-400"
                    >
                        <Timer className="h-4 w-4" />
                        Extender Trial (+7 días)
                    </DropdownMenuItem>

                    {/* SuperAdmin only */}
                    {isSuperAdmin && (
                        <>
                            {planTier === 'pro' && (
                                <DropdownMenuItem
                                    onClick={() => handleAction(downgradeToFree, 'Degradar a Free')}
                                    className="gap-2"
                                >
                                    <TrendingDown className="h-4 w-4" />
                                    Degradar a Free
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleAction(banOrganization, 'Bloquear')}
                                className="gap-2 text-rose-400 focus:text-rose-400"
                            >
                                <Ban className="h-4 w-4" />
                                Bloquear / Banear
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
