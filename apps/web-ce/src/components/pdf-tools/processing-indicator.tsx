'use client'

import { Progress } from '@tramiflow/ui'
import { Loader2, CheckCircle2, TrendingDown } from 'lucide-react'
import { cn } from '@tramiflow/core'

interface ProcessingIndicatorProps {
    isProcessing: boolean
    progress: number
    originalSize?: number
    resultSize?: number
    label?: string
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function calculateSavings(original: number, result: number): number {
    if (original === 0) return 0
    return Math.round(((original - result) / original) * 100)
}

export function ProcessingIndicator({
    isProcessing,
    progress,
    originalSize,
    resultSize,
    label = 'Procesando...'
}: ProcessingIndicatorProps) {
    const savings = originalSize && resultSize ? calculateSavings(originalSize, resultSize) : 0
    const isDone = !isProcessing && progress === 100

    return (
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-md p-5 space-y-4">
            {/* Progress Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isProcessing ? (
                        <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                    ) : isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : null}
                    <span className={cn(
                        'text-sm font-medium',
                        isProcessing ? 'text-indigo-300' : 'text-emerald-300'
                    )}>
                        {isProcessing ? label : '¡Completado!'}
                    </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                    {Math.round(progress)}%
                </span>
            </div>

            {/* Progress Bar */}
            <Progress
                value={progress}
                className="h-2 bg-slate-800"
                indicatorClassName={cn(
                    'transition-all duration-500',
                    isProcessing ? 'bg-indigo-500' : 'bg-emerald-500'
                )}
            />

            {/* File Size Comparison */}
            {originalSize !== undefined && resultSize !== undefined && isDone && (
                <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                    <div className="flex items-center gap-4 text-sm">
                        <div>
                            <span className="text-slate-500 text-xs">Original</span>
                            <p className="font-mono text-slate-300">{formatFileSize(originalSize)}</p>
                        </div>
                        <span className="text-slate-600">→</span>
                        <div>
                            <span className="text-slate-500 text-xs">Optimizado</span>
                            <p className="font-mono text-emerald-400">{formatFileSize(resultSize)}</p>
                        </div>
                    </div>
                    {savings > 0 && (
                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
                            <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">-{savings}%</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export { formatFileSize }
