import { Skeleton } from '@carlosindriago/ui'
import { TableCell, TableRow } from '@carlosindriago/ui'

interface SkeletonListProps {
    rows?: number
    columns?: number
    /**
     * If true, renders table rows with TableCell wrappers
     * If false, renders plain Skeleton divs
     */
    asTableRows?: boolean
}

/**
 * Skeleton List Component
 *
 * Loading placeholder for lists/tables
 *
 * Usage:
 *   <SkeletonList rows={5} columns={4} asTableRows />
 *
 * Or as plain divs:
 *   <SkeletonList rows={3} />
 */
export function SkeletonList({
    rows = 5,
    columns = 4,
    asTableRows = false,
}: SkeletonListProps) {
    if (asTableRows) {
        return (
            <>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <TableRow key={rowIndex} className="border-b-border-standard">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <TableCell key={colIndex} className="p-4">
                                <Skeleton className="h-4 w-full bg-muted/30" />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </>
        )
    }

    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-full bg-muted/30" />
                </div>
            ))}
        </div>
    )
}

/**
 * Skeleton Card for card-based layouts
 */
interface SkeletonCardProps {
    /**
     * Number of lines to show in the card
     */
    lines?: number
    /**
     * Whether to show a header (avatar + title)
     */
    showHeader?: boolean
}

export function SkeletonCard({ lines = 3, showHeader = true }: SkeletonCardProps) {
    return (
        <div className="rounded-lg border border-border-standard bg-elevation-1 p-6 shadow-sm">
            {showHeader && (
                <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full bg-muted/30" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4 bg-muted/30" />
                        <Skeleton className="h-3 w-1/2 bg-muted/30" />
                    </div>
                </div>
            )}
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full bg-muted/30" />
                ))}
            </div>
        </div>
    )
}
