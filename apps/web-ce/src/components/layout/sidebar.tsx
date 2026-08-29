'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    Loader2,
    Globe,
    ClipboardList,
    ListChecks,
    Wrench,
    Sparkles,
    AlertTriangle,
    Archive,
    BarChart3
} from 'lucide-react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    Avatar,
    AvatarFallback,
    Button
} from '@carlosindriago/ui'
import Link from 'next/link'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { type UserOrganization, type OrganizationPlan, type OrganizationRole } from '@carlosindriago/core'
import { createClient } from '@carlosindriago/database/client'
import { useLimits } from '@/hooks/use-limits'
import { differenceInDays } from 'date-fns'

function RenewalCard() {
    const { limits, loading } = useLimits()

    if (loading || !limits) return null

    const RENEWAL_NOTICE_DAYS = 5
    const isFree = limits.planCode === 'free'
    const daysLeft = limits.subscriptionEndsAt
        ? differenceInDays(new Date(limits.subscriptionEndsAt), new Date())
        : 999

    if (isFree) {
        return (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded-md bg-emerald-500/20">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-300">Plan Gratuito</span>
                </div>
                <Button size="sm" className="w-full text-xs h-7 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-sm" asChild>
                    <Link href="/settings/billing">
                        Mejorar Plan
                    </Link>
                </Button>
            </div>
        )
    }

    if (daysLeft <= RENEWAL_NOTICE_DAYS) {
        const isExpired = daysLeft < 0
        return (
            <div className="rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded-md bg-orange-500/20">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                    <span className="text-xs font-semibold text-orange-300">
                        {isExpired ? 'Suscripción Vencida' : 'Renovación Pendiente'}
                    </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                    {isExpired ? 'Renová para recuperar acceso.' : `Tu plan vence en ${daysLeft} días.`}
                </p>
                <Button size="sm" variant="destructive" className="w-full text-xs h-7" asChild>
                    <Link href="/settings/billing">
                        Renovar Suscripción
                    </Link>
                </Button>
            </div>
        )
    }

    return null
}

const navSections = [
    {
        label: 'PRINCIPAL',
        items: [
            { title: 'Dashboard', icon: LayoutDashboard, href: '/' },
            { title: 'Trámites', icon: ClipboardList, href: '/procedures' },
            { title: 'Archivo', icon: Archive, href: '/archive' },
            { title: 'Plantillas', icon: FileText, href: '/templates' },
            { title: 'Leads', icon: Users, href: '/leads' },
            { title: 'Clientes', icon: Users, href: '/clients' },
        ],
    },
    {
        label: 'HERRAMIENTAS',
        items: [
            { title: 'Plantillas de Docs', icon: FileText, href: '/documents/templates' },
            { title: 'Reportes Pro', icon: BarChart3, href: '/reports' },
            { title: 'PDF Kit', icon: Wrench, href: '/tools/pdf' },
        ],
    },
    {
        label: 'SISTEMA',
        items: [
            { title: 'Configuración', icon: Settings, href: '/settings' },
            { title: 'Estados', icon: ListChecks, href: '/settings/statuses' },
            { title: 'Mi Sitio Web', icon: Globe, href: '/website' },
        ],
    },
]

interface MemberOrgQueryResult {
    role: string | null
    organization: {
        id: string
        name: string
        slug: string | null
        logo_url: string | null
        plan: string | null
    } | null
}

export function AppSidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)
    const [organizations, setOrganizations] = useState<UserOrganization[]>([])
    const [currentOrg, setCurrentOrg] = useState<UserOrganization | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(true)
    const [isSigningOut, setIsSigningOut] = useState(false)

    useEffect(() => {
        async function fetchUserData() {
            try {
                const res = await fetch('/api/auth/user')
                if (res.ok) {
                    const data = await res.json()
                    setUser(data.user)

                    const supabase = createClient()
                    const { data: members, error } = await supabase
                        .from('organization_members')
                        .select(`
                            role,
                            organization:organizations (
                                id,
                                name,
                                slug,
                                logo_url,
                                plan
                            )
                        `)
                        .eq('user_id', data.user.id)

                    if (error) {
                        console.error('Error fetching organizations:', error)
                        return
                    }

                    if (members) {
                        const rawMembers = members as unknown as MemberOrgQueryResult[]
                        const orgs: UserOrganization[] = rawMembers
                            .filter((m) => m.organization !== null)
                            .map((m) => {
                                const plan: OrganizationPlan = (m.organization?.plan === 'pro' || m.organization?.plan === 'enterprise') ? m.organization.plan : 'free'
                                const roleLower = m.role?.toLowerCase() || 'member'
                                const role: OrganizationRole = (roleLower === 'owner' || roleLower === 'admin') ? roleLower : 'member'

                                return {
                                    id: m.organization!.id,
                                    name: m.organization!.name,
                                    slug: m.organization!.slug || '',
                                    logo_url: m.organization!.logo_url,
                                    plan,
                                    role,
                                }
                            })

                        setOrganizations(orgs)

                        if (orgs.length > 0) {
                            setCurrentOrg(orgs[0])
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserData()
    }, [])

    async function handleSignOut(e?: Event | React.SyntheticEvent) {
        e?.preventDefault()
        setIsSigningOut(true)
        try {
            const supabase = createClient()
            await supabase.auth.signOut()
            await fetch('/api/auth/signout', { method: 'POST' })
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            window.location.href = '/login'
        }
    }

    const initials = user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U'

    return (
        <Sidebar className="border-r border-sidebar-border bg-sidebar">
            {/* Header - Team Switcher */}
            <SidebarHeader className="border-b border-sidebar-border/60 bg-sidebar px-4 py-4">
                <TeamSwitcher
                    organizations={organizations}
                    currentOrganization={currentOrg}
                    onOrganizationChange={(org) => setCurrentOrg(org)}
                />
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent className="flex flex-col px-3 py-5 gap-5">
                {navSections.map((section) => (
                    <SidebarGroup key={section.label}>
                        <SidebarGroupLabel className="text-[11px] font-semibold text-muted-foreground/70 px-3 mb-1.5 tracking-wider uppercase">
                            {section.label}
                        </SidebarGroupLabel>

                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                tooltip={item.title}
                                                className={`
                                                    h-9 px-3 rounded-lg text-sm font-medium transition-all duration-150
                                                    ${isActive
                                                        ? 'bg-emerald-500/10 text-emerald-400 font-semibold shadow-xs'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60'
                                                    }
                                                `}
                                            >
                                                <Link href={item.href} className="flex items-center gap-3 w-full">
                                                    <item.icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            {/* Conversion Hook */}
            <div className="px-3 pb-3">
                <RenewalCard />
            </div>

            {/* Footer - User Profile */}
            <SidebarFooter className="border-t border-sidebar-border/60 bg-sidebar p-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="h-auto px-3 py-2.5 rounded-xl bg-sidebar-accent/40 hover:bg-sidebar-accent border border-sidebar-border/60 transition-all duration-150"
                                >
                                    <Avatar className="h-8 w-8 ring-1 ring-border bg-muted">
                                        <AvatarFallback className="text-[11px] font-bold bg-emerald-700 text-white">
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                initials
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start flex-1 min-w-0 ml-2.5">
                                        {isLoading ? (
                                            <span className="text-muted-foreground text-xs">Cargando...</span>
                                        ) : (
                                            <>
                                                <span className="font-medium text-foreground truncate text-xs">
                                                    {user?.name || 'Usuario'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground truncate">
                                                    {user?.email || ''}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {!isLoading && (
                                        <div className="ml-1.5 h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                            <LogOut className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56 rounded-xl border border-border bg-popover shadow-lg"
                                align="end"
                                side="top"
                                sideOffset={8}
                            >
                                <DropdownMenuItem asChild>
                                    <Link href="/settings/account" className="flex items-center gap-2 cursor-pointer text-sm">
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                        <span>Mi Cuenta</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    disabled={isSigningOut}
                                    className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10 text-sm"
                                >
                                    {isSigningOut ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <LogOut className="h-4 w-4" />
                                    )}
                                    <span>{isSigningOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
