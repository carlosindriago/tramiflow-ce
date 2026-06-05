'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Badge } from '@tramiflow/ui'
import { cn } from '@tramiflow/core'
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Package,
    LineChart,
    Shield,
    ArrowLeft
} from 'lucide-react'

interface AdminNavProps {
    role: string
    pendingPaymentsCount: number
}

export function AdminNav({ role, pendingPaymentsCount }: AdminNavProps) {
    const pathname = usePathname()

    const links = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/orgs', label: 'Organizaciones', icon: Building2 },
        { href: '/admin/users', label: 'Usuarios', icon: Users },
        { href: '/admin/payments', label: 'Pagos', badge: pendingPaymentsCount, icon: CreditCard },
        { href: '/admin/plans', label: 'Planes', icon: Package },
        { href: '/admin/analytics', label: 'Analytics', icon: LineChart },
    ]

    if (role === 'super_admin') {
        links.push({ href: '/admin/settings/team', label: 'Equipo', icon: Shield })
    }

    return (
        <nav className="flex flex-col gap-1 w-full">
            <div className="px-3 pb-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-border/10">
                Menu
            </div>
            {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(`${link.href}/`))
                const Icon = link.icon
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "group flex items-center justify-between px-3 py-2 text-sm transition-all rounded-md",
                            isActive
                                ? "text-foreground opacity-100 font-medium bg-white/5"
                                : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Icon className={cn("h-4 w-4", isActive ? "text-foreground" : "text-foreground/50 group-hover:text-foreground")} />
                            <span>{link.label}</span>
                        </div>
                        {link.badge !== undefined && link.badge > 0 && (
                            <Badge variant="destructive" className="h-4 px-1.5 text-[10px] min-w-[1.25rem] justify-center bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:bg-rose-500/30">
                                {link.badge}
                            </Badge>
                        )}
                    </Link>
                )
            })}

            <div className="mt-8 px-3 pb-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-border/10">
                App
            </div>
<Link
  href="/"
  className="group flex items-center gap-3 px-3 py-2 text-sm text-foreground/60 hover:text-foreground hover:bg-white/5 transition-all rounded-md"
>
  <ArrowLeft className="h-4 w-4 text-foreground/50 group-hover:text-foreground" />
  <span>Volver a la App</span>
</Link>
        </nav>
    )
}
