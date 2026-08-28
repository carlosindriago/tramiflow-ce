import React, { forwardRef } from 'react'
import { cn } from '@carlosindriago/ui'
import type { DocumentMargins } from '@carlosindriago/core'

export interface A4PaperContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    margins?: DocumentMargins
    className?: string
    children: React.ReactNode
}

export const A4PaperContainer = forwardRef<HTMLDivElement, A4PaperContainerProps>(
    ({ margins = { top: 20, right: 20, bottom: 20, left: 20 }, className, children, style, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'a4-paper-container relative bg-white text-zinc-900 shadow-xl rounded-xs transition-all mx-auto',
                    'w-full max-w-[210mm] min-h-[297mm]',
                    'print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none print:min-h-0 print:rounded-none',
                    className
                )}
                style={{
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
