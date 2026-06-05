// @ts-nocheck
'use client'

import { Procedure, ProcedureStatus, PROCEDURE_STATUS_LABELS } from '@tramiflow/core'
import { Card, CardContent } from '@tramiflow/ui'
import { Progress } from '@tramiflow/ui'
import { Button } from '@tramiflow/ui'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@tramiflow/ui'
import { Calendar, User, MoreVertical, Check } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

import { ProcedureStatus as ProcedureStatusConfig } from '@tramiflow/core'
import { cn } from '@tramiflow/core'

interface ProcedureCardProps {
    procedure: Procedure
    onClick?: () => void
    hideClient?: boolean
    onStatusChange?: (status: ProcedureStatus) => void
    statuses?: ProcedureStatusConfig[]
  onOpenDrawer?: (procedureId: string) => void
}

export function ProcedureCard({ procedure, onClick, hideClient, onStatusChange, statuses, onOpenDrawer }: ProcedureCardProps) {
    // Calculate progress
    const requirements = procedure.requirements_snapshot || []

    const checklist = procedure.checklist_progress || {}
    const totalReqs = Array.isArray(requirements) ? requirements.length : 0
    const completedReqs = Array.isArray(requirements)
/* eslint-disable */
        ? requirements.filter((r: any) => checklist[r.id || r]).length
        : 0
  const steps = procedure.template?.steps ?? []
  const hasSteps = steps.length > 0
  const completedStepsCount = hasSteps ? steps.filter(s => procedure.steps_progress?.[s.id] === true).length : 0

    const progress = totalReqs > 0 ? (completedReqs / totalReqs) * 100 : 0

    // Get status color configuration
    const statusConfig = statuses?.find(s => s.id === procedure.status) || procedure.status_details
    const statusColor = statusConfig?.color || '#3b82f6' // Default Blue

    // Styling
    // We use a very light opacity for background to work on both light and dark modes
    // Dark mode usually ignores low opacity light backgrounds or blends them.
    // For reliable dark mode, we might want to use CSS variables or `bg-opacity`.
    // But since we have arbitrary hex colors, we use inline styles with opacity.

    // Hex transparency: 0D = ~5%, 1A = ~10%
    // We'll use a very subtle fill

    const cardStyle = {
        borderLeftColor: statusColor,
        // Dynamic background tint
        // Using a linear gradient to make it look "premium" and subtle
        backgroundImage: `linear-gradient(to right, ${statusColor}08, ${statusColor}00)`,
    }

/* eslint-disable */
    const progressStyle = {
        // You can also color the progress bar if you want
        // backgroundColor: statusColor
    }

    const Content = (
        <CardContent className="p-3 space-y-3 relative group">
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-1 leading-snug" title={procedure.title}>
                        {procedure.title}
                    </h4>
                    {!hideClient && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 min-w-0">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate min-w-0 flex-1">
                                {procedure.client?.full_name || 'Sin cliente'}
                            </span>
                        </div>
                    )}
                </div>
                {onStatusChange && (
                    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onPointerDown={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 -mr-2 -mt-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200"
                                >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 z-50">
                                <DropdownMenuLabel className="text-xs">Mover a...</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {statuses ? (
                                    statuses.map((status) => {
                                        if (status.id === procedure.status) return null
                                        return (
                                            <DropdownMenuItem
                                                key={status.id}
                                                onClick={() => onStatusChange(status.id as any)}
                                                className="text-xs gap-2"
                                            >
                                                <div
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: status.color }}
                                                />
                                                {status.name}
                                            </DropdownMenuItem>
                                        )
                                    })
                                ) : (
                                    // Fallback for legacy
                                    Object.entries(PROCEDURE_STATUS_LABELS).map(([status, label]) => {
                                        if (status === procedure.status) return null
                                        return (
                                            <DropdownMenuItem
                                                key={status}
                                                onClick={() => onStatusChange(status as any)}
                                                className="text-xs"
                                            >
                                                {label}
                                            </DropdownMenuItem>
                                        )
                                    })
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {hasSteps ? (
                <>
                    {/* Steps checklist */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                            <span>Pasos</span>
                            <span>{completedStepsCount}/{steps.length}</span>
                        </div>
                        <Progress
                            value={(completedStepsCount / steps.length) * 100}
                            className="h-1.5 bg-muted/50"
                            indicatorClassName={cn("transition-all duration-500")}
                            indicatorStyle={{ backgroundColor: statusColor }}
                        />
                    </div>
                    <div className="space-y-1 mt-1">
                        {steps.map((step) => {
                            const done = procedure.steps_progress?.[step.id] === true
                            return (
                                <div key={step.id} className="flex items-center gap-1.5 text-[11px]">
                                    <div className={cn(
                                        "h-3 w-3 rounded-full flex items-center justify-center flex-shrink-0",
                                        done ? "bg-emerald-500" : "border border-muted-foreground/40"
                                    )}>
                                        {done && <Check className="h-2 w-2 text-white" />}
                                    </div>
                                    <span className={cn(
                                        "truncate",
                                        done ? "text-muted-foreground line-through" : "text-foreground/80"
                                    )}>
                                        {step.title}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </>
            ) : (
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span>Progreso</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress
                        value={progress}
                        className="h-1.5 bg-muted/50"
                        indicatorClassName={cn("transition-all duration-500")}
                        indicatorStyle={{ backgroundColor: statusColor }}
                    />
                </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5" title="Fecha de creación">
                    <Calendar className="h-3 w-3 opacity-70" />
                    <span>{format(new Date(procedure.created_at), 'd MMM', { locale: es })}</span>
                </div>
                {hasSteps && onOpenDrawer ? (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onOpenDrawer(procedure.id) }}
                        className="text-[10px] font-medium text-primary hover:underline"
                    >
                        Ver detalles &rarr;
                    </button>
                ) : (
                    <div className="flex items-center gap-1 opacity-70">
                        <span>{completedReqs}/{totalReqs} reqs</span>
                    </div>
                )}
            </div>
        </CardContent>
    )

    // Si tiene onOpenDrawer (modo kanban con drawer), usar Card sin Link
    if (onOpenDrawer && hasSteps) {
        return (
            <Card
                className="border-l-[3px] h-full"
                style={cardStyle}
            >
                {Content}
            </Card>
        )
    }

    if (onClick) {
        return (
            <Card
                className="cursor-pointer hover:shadow-md transition-all duration-300 border-l-[3px] h-full"
                style={cardStyle}
                onClick={onClick}
            >
                {Content}
            </Card>
        )
    }

    return (
        <Link href={`/procedures/${procedure.id}`} className="block h-full">
            <Card
                className="cursor-pointer hover:shadow-md active:scale-[0.99] transition-all duration-300 border-l-[3px] h-full"
                style={cardStyle}
            >
                {Content}
            </Card>
        </Link>
    )
}

