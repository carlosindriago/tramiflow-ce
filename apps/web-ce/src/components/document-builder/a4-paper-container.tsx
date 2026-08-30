import React, { forwardRef } from 'react'
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

        return (
            <div
                ref={ref}
                className={cn(
                    'a4-paper-container relative bg-white text-zinc-900 shadow-xl rounded-xs transition-all mx-auto',
                    'w-full h-auto',
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
                {children}
            </div>
        )
    }
)

A4PaperContainer.displayName = 'A4PaperContainer'
export const PaperContainer = A4PaperContainer
