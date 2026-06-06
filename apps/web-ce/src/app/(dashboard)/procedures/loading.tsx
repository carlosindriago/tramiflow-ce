import { Skeleton } from '@carlosindriago/ui'

export default function ProceduresLoading() {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden animate-in fade-in-0 duration-500">
            {/* Header Area */}
            <div className="flex-none px-6 pt-6 pb-3 flex justify-between items-end">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 bg-slate-800/50" />
                    <Skeleton className="h-4 w-72 bg-slate-800/30" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-32 bg-slate-800/40" />
                    <Skeleton className="h-9 w-24 bg-slate-800/30" />
                </div>
            </div>

            {/* Kanban Columns Skeleton */}
            <div className="flex-1 min-h-0 px-6 pb-4 flex gap-4 overflow-x-auto no-scrollbar">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="min-w-[280px] w-[280px] flex flex-col gap-3">
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-2">
                            <Skeleton className="h-6 w-24 bg-slate-800/50" />
                            <Skeleton className="h-5 w-8 rounded-full bg-slate-800/40" />
                        </div>
                        
                        {/* Cards Skeletons */}
                        <Skeleton className="h-32 rounded-xl bg-slate-800/30 border border-slate-800/40" />
                        <Skeleton className="h-28 rounded-xl bg-slate-800/20 border border-slate-800/30" />
                        <Skeleton className="h-36 rounded-xl bg-slate-800/10 border border-slate-800/20" />
                    </div>
                ))}
            </div>
        </div>
    )
}
