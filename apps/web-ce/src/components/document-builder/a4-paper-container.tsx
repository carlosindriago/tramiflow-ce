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

        return (
            <div
                ref={ref}
                className={cn(
                    'a4-paper-container relative bg-white text-zinc-900 shadow-xl rounded-xs transition-all mx-auto',
                    'w-full',
                    'print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none print:min-h-0 print:rounded-none',
                    className
                )}
                style={{
                    maxWidth: `${width}mm`,
                    minHeight: `${height}mm`,
                    paddingTop: `${margins.top}mm`,
                    paddingRight: `${margins.right}mm`,
                    paddingBottom: `${margins.bottom}mm`,
                    paddingLeft: `${margins.left}mm`,
                    printColorAdjust: 'exact',
                    WebkitPrintColorAdjust: 'exact',
                    ...style,
                }}
                {...props}
            >
                {children}
            </div>
        )
    }
)

A4PaperContainer.displayName = 'A4PaperContainer'
export const PaperContainer = A4PaperContainer
