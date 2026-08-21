'use client'

import { Plus } from 'lucide-react'
import { Button } from '@carlosindriago/ui'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { SidebarTrigger } from '@carlosindriago/ui'
import { NotificationsBell } from '@/components/layout/notifications-bell'
import { GlobalSearch } from '@/components/global-search'
import Link from 'next/link'

export function Header() {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-background/80 backdrop-blur-md px-4 md:px-6 sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />

                <NotificationsBell />

                <Button asChild className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-95">
                    <Link href="/procedures?new=true">
                        <Plus className="h-4 w-4" />
                        Nuevo Trámite
                    </Link>
                </Button>
            </div>
        </header>
    )
}
