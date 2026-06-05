import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 animate-in fade-in-0 duration-500">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-48 bg-slate-800/50" />
                <Skeleton className="h-4 w-72 bg-slate-800/30" />
            </div>

            {/* Stat Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl bg-slate-800/40 border border-slate-800/50" />
                ))}
            </div>

            {/* Bottom Content (Tables/Lists) */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-[400px] rounded-xl bg-slate-800/20 border border-slate-800/30" />
                <Skeleton className="h-[400px] rounded-xl bg-slate-800/20 border border-slate-800/30" />
            </div>
        </div>
    )
}
