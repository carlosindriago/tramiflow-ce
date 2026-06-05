'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
    Wrench
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
} from '@/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { signOutAction } from '@/actions/auth'
import Link from 'next/link'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { type UserOrganization } from '@/types/organization'
import { createClient } from '@/lib/supabase/client'
import { useLimits } from '@/hooks/use-limits'
import { Button } from '@/components/ui/button'
import { Sparkles, AlertTriangle, Archive } from 'lucide-react'
import { differenceInDays } from 'date-fns'

function RenewalCard() {
    const { limits, loading } = useLimits()

    if (loading || !limits) return null

    const RENEWAL_NOTICE_DAYS = 5
    const isFree = limits.planCode === 'free'
    const daysLeft = limits.subscriptionEndsAt
        ? differenceInDays(new Date(limits.subscriptionEndsAt), new Date())
        : 999

    // Logic:
    // 1. Free Plan -> Always show "Upgrade"
    // 2. Pro Plan -> Show "Renew" if checking expiration (daysLeft <= 5)

    if (isFree) {
        return (
            <div className="rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded bg-indigo-500/20">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                    <span className="text-xs font-semibold text-indigo-200">Plan Gratuito</span>
                </div>
                <Button size="sm" className="w-full text-xs h-7 bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-900/20" asChild>
                    <Link href="/settings/billing">
                        🚀 Mejorar Plan
                    </Link>
                </Button>
            </div>
        )
    }

    if (daysLeft <= RENEWAL_NOTICE_DAYS) {
        const isExpired = daysLeft < 0
        return (
            <div className="rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded bg-orange-500/20">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                    <span className="text-xs font-semibold text-orange-200">
                        {isExpired ? 'Suscripción Vencida' : 'Renovación Pendiente'}
                    </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">
                    {isExpired ? 'Renueva para recuperar acceso.' : `Tu plan vence en ${daysLeft} días.`}
                </p>
                <Button size="sm" variant="destructive" className="w-full text-xs h-7 shadow-lg shadow-red-900/20" asChild>
                    <Link href="/settings/billing">
                        ⚠️ Renovar Suscripción
                    </Link>
                </Button>
            </div>
        )
    }

    return null
}

// Navigation groups with sections
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

export function AppSidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)
    const [organizations, setOrganizations] = useState<UserOrganization[]>([])
    const [currentOrg, setCurrentOrg] = useState<UserOrganization | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(true)
    const [isSigningOut, setIsSigningOut] = useState(false)

    useEffect(() => {
        async function fetchUserData() {
            try {
                // Fetch user profile
                const res = await fetch('/api/auth/user')
                if (res.ok) {
                    const data = await res.json()
                    setUser(data.user)

                    // Fetch real organizations using Supabase Client
                    const supabase = createClient()

                    // We need to fetch via organization_members to get the ones the user belongs to
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
                        // Map to UserOrganization type
                        const orgs: UserOrganization[] = members.map((m: any) => ({
                            id: m.organization.id,
                            name: m.organization.name,
                            slug: m.organization.slug || '',
                            logo_url: m.organization.logo_url,
                            plan: m.organization.plan || 'free',
                            role: m.role
                        }))

                        setOrganizations(orgs)

                        // Set current (try to find matching ID in local storage or default to first)
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

    async function handleSignOut() {
        setIsSigningOut(true)
        try {
            await signOutAction()
            router.push('/login')
            router.refresh()
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            setIsSigningOut(false)
        }
    }

    const initials = user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U'

    return (
        <Sidebar className="border-r border-slate-800 bg-slate-900/50 backdrop-blur-md">
            {/* Header - Team Switcher with Multi-tenant Architecture */}
            <SidebarHeader className="border-b border-slate-800/50 bg-slate-900/40 px-4 py-4">
                <TeamSwitcher
                    organizations={organizations}
                    currentOrganization={currentOrg}
                    onOrganizationChange={(org) => setCurrentOrg(org)}
                />
            </SidebarHeader>

            {/* Navigation with sections */}
            <SidebarContent className="flex flex-col px-4 py-6 gap-6">
                {navSections.map((section) => (
                    <SidebarGroup key={section.label}>
                        {/* Section Header */}
                        <SidebarGroupLabel className="text-xs font-semibold text-slate-500 px-2 mb-2 tracking-wider uppercase">
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
                                                    h-9 px-2.5 rounded-md text-sm font-medium transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
                                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border-l-2 border-transparent'
                                                    }
                                                `}
                                            >
                                                <Link href={item.href} className="flex items-center gap-3 w-full">
                                                    <item.icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
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

            {/* Conversion Hook / Renewal Notice */}
            <div className="px-4 pb-4">
                <RenewalCard />
            </div>

            {/* Footer - User Profile with premium card style */}
            <SidebarFooter className="border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="h-auto px-3 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all duration-200 data-[state=open]:bg-slate-800 data-[state=open]:border-slate-600"
                                >
                                    <Avatar className="h-8 w-8 ring-2 ring-slate-700/50 bg-slate-800">
                                        <AvatarFallback className="text-[11px] font-bold bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                initials
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start flex-1 min-w-0 ml-3">
                                        {isLoading ? (
                                            <span className="text-slate-400 text-xs">Cargando...</span>
                                        ) : (
                                            <>
                                                <span className="font-medium text-slate-200 truncate text-xs">
                                                    {user?.name || 'Usuario'}
                                                </span>
                                                <span className="text-[10px] text-slate-500 truncate">
                                                    {user?.email || ''}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {!isLoading && (
                                        <div className="ml-2 h-5 w-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
                                            <LogOut className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-56 bg-slate-900 border-slate-700/50"
                                side="top"
                            >
                                <DropdownMenuItem
                                    onSelect={handleSignOut}
                                    disabled={isSigningOut}
                                    className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 text-xs"
                                >
                                    {isSigningOut ? (
                                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <LogOut className="mr-2 h-3.5 w-3.5" />
                                    )}
                                    Cerrar sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
