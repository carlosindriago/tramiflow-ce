'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { NotificationsBell } from '@/components/layout/notifications-bell'
import { GlobalSearch } from '@/components/global-search'
import Link from 'next/link'

export function Header() {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />

                <NotificationsBell />

                <Button asChild className="hidden md:flex gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 border-0">
                    <Link href="/procedures?new=true">
                        <Plus className="h-4 w-4" />
                        Nuevo Trámite
                    </Link>
                </Button>
            </div>
        </header>
    )
}
