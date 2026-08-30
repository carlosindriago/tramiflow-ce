import React, { forwardRef } from 'react'
import { Info } from 'lucide-react'
import { cn, getPaperDimensions, type DocumentMargins, type PaperConfiguration } from '@carlosindriago/core'

export interface A4PaperContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    margins?: DocumentMargins
    paperConfig?: PaperConfiguration | null
    className?: string
    children: React.ReactNode
}

export const A4PaperContainer = forwardRef<HTMLDivElement, A4PaperContainerProps>(
    (
        {
            margins = { top: 20, right: 20, bottom: 20, left: 20 },
            paperConfig = { format: 'a4' },
            className,
            children,
            style,
            ...props
        },
        ref
    ) => {
        const { width, height } = getPaperDimensions(paperConfig)
        const firstPageTop = margins.first_page_top ?? margins.top
        const firstPageBottom = margins.first_page_bottom ?? margins.bottom
        const firstPageLeft = margins.first_page_left ?? margins.left
        const firstPageRight = margins.first_page_right ?? margins.right

        const hasCustomFirstPage =
            firstPageTop !== margins.top ||
            firstPageBottom !== margins.bottom ||
            firstPageLeft !== margins.left ||
            firstPageRight !== margins.right

        return (
            <div
                ref={ref}
                className={cn(
                    'a4-paper-container relative bg-white text-zinc-900 shadow-xl rounded-xs transition-all mx-auto',
                    'w-full',
                    'print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none print:min-h-0 print:rounded-none print:bg-none print:bg-white',
                    className
                )}
                style={{
                    ['--page-width' as string]: `${width}mm`,
                    ['--page-height' as string]: `${height}mm`,
                    ['--page-margin-top' as string]: `${margins.top}mm`,
                    ['--page-margin-right' as string]: `${margins.right}mm`,
                    ['--page-margin-bottom' as string]: `${margins.bottom}mm`,
                    ['--page-margin-left' as string]: `${margins.left}mm`,
                    ['--first-page-margin-top' as string]: `${firstPageTop}mm`,
                    ['--first-page-margin-bottom' as string]: `${firstPageBottom}mm`,
                    ['--first-page-margin-left' as string]: `${firstPageLeft}mm`,
                    ['--first-page-margin-right' as string]: `${firstPageRight}mm`,
                    maxWidth: `${width}mm`,
                    minHeight: `${height}mm`,
                    paddingTop: 'var(--first-page-margin-top)',
                    paddingRight: 'var(--page-margin-right)',
                    paddingBottom: 'var(--page-margin-bottom)',
                    paddingLeft: 'var(--page-margin-left)',
                    backgroundImage:
                        'repeating-linear-gradient(to bottom, transparent 0, transparent calc(var(--page-height) - 1px), rgba(148, 163, 184, 0.35) calc(var(--page-height) - 1px), rgba(148, 163, 184, 0.35) var(--page-height))',
                    backgroundPosition: '0 0',
                    backgroundSize: '100% var(--page-height)',
                    printColorAdjust: 'exact',
                    WebkitPrintColorAdjust: 'exact',
                    ...style,
                } as React.CSSProperties}
                {...props}
            >
                {/* WYSIWYM Margins Badge (Hidden on print) */}
                <div className="absolute top-2 right-2 print:hidden select-none pointer-events-none z-10 max-w-sm">
                    <div className="flex flex-col gap-1 p-2 rounded-md border border-zinc-200/80 dark:border-zinc-700/80 bg-white/90 dark:bg-black/70 backdrop-blur-md shadow-xs text-zinc-700 dark:text-zinc-300">
                        <div className="flex flex-col gap-0.5 font-mono text-[11px] font-medium leading-tight">
                            <span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Gen:</span> Sup {margins.top} | Inf {margins.bottom} | Izq {margins.left} | Der {margins.right} mm
                            </span>
                            {hasCustomFirstPage && (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    <span className="font-semibold">Pág 1:</span> Sup {firstPageTop} | Inf {firstPageBottom} | Izq {firstPageLeft} | Der {firstPageRight} mm
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-muted-foreground border-t border-zinc-200/60 dark:border-zinc-700/60 leading-tight">
                            <Info className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span>Vista de redacción continua. Usa &quot;Previsualizar Documento Impreso&quot; para ver la paginación y formato exactos.</span>
                        </div>
                    </div>
                </div>

                {children}
            </div>
        )
    }
)

A4PaperContainer.displayName = 'A4PaperContainer'
export const PaperContainer = A4PaperContainer
