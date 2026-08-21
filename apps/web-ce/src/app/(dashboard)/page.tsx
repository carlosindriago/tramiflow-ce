import { createClient } from '@carlosindriago/database/server'
import {
    AlertTriangle,
    FileText,
    UserPlus,
    Calendar,
    Eye,
    Zap,
    TrendingUp,
    Activity,
    Plus,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Sparkles,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getLeadsStats } from '@/lib/actions/dashboard'
import Link from 'next/link'
import type { Database } from '@carlosindriago/database/types'

export const dynamic = 'force-dynamic'

type ProcedureWithClient = Database['public']['Tables']['procedures']['Row'] & {
  clients: { full_name: string } | null
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Usuario no autenticado</div>
    }

    // 1. Get Organization
    const { data: members } = await supabase.from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

    const orgId = members?.[0]?.organization_id

    if (!orgId) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Bienvenido a TramiFlow</h2>
                <p className="text-muted-foreground mt-2">Para comenzar, debes crear o unirte a una organización.</p>
            </div>
        )
    }

    // 2. Fetch Data in Parallel
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()

    const next30Days = new Date(today)
    next30Days.setDate(today.getDate() + 30)

    const [
        { count: totalClients },
        { count: activeProcedures },
        { count: expiringSoon }, // 7 days
        { count: expiringMonth }, // 30 days
        { count: attendedMonth },
        { data: recentActivity },
        { data: upcomingExpirations },
        leadsStats,
        { count: leadsToday },
        { data: orgData }
    ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('procedures').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .neq('status', 'completed')
            .neq('status', 'archived'),
        supabase.from('procedures').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('expiration_date', today.toISOString())
            .lte('expiration_date', nextWeek.toISOString()),
        supabase.from('procedures').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('expiration_date', today.toISOString())
            .lte('expiration_date', next30Days.toISOString()),
        supabase.from('procedures').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('updated_at', new Date(today.getFullYear(), today.getMonth(), 1).toISOString()),
        supabase.from('procedures').select('*, clients(full_name)')
            .eq('organization_id', orgId)
            .order('updated_at', { ascending: false })
            .limit(5),
        supabase.from('procedures').select('*, clients(full_name)')
            .eq('organization_id', orgId)
            .gte('expiration_date', today.toISOString())
            .order('expiration_date', { ascending: true })
            .limit(5),
        getLeadsStats(),
        supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('created_at', startOfDay),
        supabase.from('organizations').select('page_views').eq('id', orgId).single()
    ])

    const stats = [
        // Fila 1: Marketing / Crecimiento
        {
            title: 'Visitas Perfil',
            value: orgData?.page_views || 0,
            badge: 'Total',
            badgeClass: 'bg-muted text-muted-foreground border-border/50',
            description: 'Vistas del perfil público',
            icon: Eye,
            iconClass: 'text-emerald-400',
        },
        {
            title: 'Leads Hoy',
            value: leadsToday || 0,
            badge: (leadsToday || 0) > 0 ? 'Activo' : 'Hoy',
            badgeClass: (leadsToday || 0) > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-muted text-muted-foreground border-border/50',
            description: 'Prospectos registrados hoy',
            icon: Zap,
            iconClass: 'text-amber-400',
        },
        {
            title: 'Leads Mes',
            value: leadsStats.value,
            badge: leadsStats.trend === 'up' ? 'En alza' : 'Estable',
            badgeClass: leadsStats.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border/50',
            description: leadsStats.description,
            icon: TrendingUp,
            iconClass: 'text-emerald-400',
        },
        {
            title: 'Total Clientes',
            value: totalClients || 0,
            badge: 'Cartera',
            badgeClass: 'bg-muted text-muted-foreground border-border/50',
            description: 'Clientes registrados',
            icon: UserPlus,
            iconClass: 'text-zinc-400',
        },

        // Fila 2: Operaciones / Gestión
        {
            title: 'Trámites Activos',
            value: activeProcedures || 0,
            badge: 'En curso',
            badgeClass: (activeProcedures || 0) > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border/50',
            description: 'Expedientes en gestión',
            icon: FileText,
            iconClass: 'text-emerald-400',
        },
        {
            title: 'Actividad Mes',
            value: attendedMonth || 0,
            badge: 'Movimientos',
            badgeClass: 'bg-muted text-muted-foreground border-border/50',
            description: 'Actualizaciones este mes',
            icon: Activity,
            iconClass: 'text-zinc-400',
        },
        {
            title: 'Vencen (7 Días)',
            value: expiringSoon || 0,
            badge: (expiringSoon || 0) > 0 ? 'Urgente' : 'Al día',
            badgeClass: (expiringSoon || 0) > 0 ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-muted text-muted-foreground border-border/50',
            description: 'Vencimientos próximos',
            icon: AlertTriangle,
            iconClass: (expiringSoon || 0) > 0 ? 'text-red-400' : 'text-zinc-400',
        },
        {
            title: 'Vencen (30 Días)',
            value: expiringMonth || 0,
            badge: 'Mensual',
            badgeClass: 'bg-muted text-muted-foreground border-border/50',
            description: 'Proyección a 30 días',
            icon: Calendar,
            iconClass: 'text-zinc-400',
        }
    ]

    const isFirstTime = (totalClients || 0) === 0 && (activeProcedures || 0) === 0
    const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Gestor'

    return (
        <div className="space-y-6 p-4 md:p-8 animate-in fade-in duration-500">
            {/* Welcome Command Center Header */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-emerald-950/20 p-6 md:p-8 shadow-sm">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Sparkles className="h-3 w-3" />
                                Centro de Comando
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                            Hola, {username}
                        </h1>
                        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
                            {isFirstTime
                                ? 'Tu entorno de gestión está listo. Comenzá configurando tus plantillas y registrando tus primeros clientes.'
                                : 'Panel de control de expedientes, estados de clientes y seguimiento de vencimientos.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link 
                            href="/templates/new" 
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva Plantilla
                        </Link>
                        <Link 
                            href="/clients/new" 
                            className="inline-flex items-center gap-2 rounded-xl bg-muted/80 border border-border/80 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all active:scale-95"
                        >
                            <UserPlus className="h-4 w-4" />
                            Registrar Cliente
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid 4x2 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div
                        key={stat.title}
                        className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:border-border hover:shadow-md"
                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {stat.title}
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 border border-border/40 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all">
                                <stat.icon className={`h-4 w-4 ${stat.iconClass}`} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
                                {stat.value}
                            </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${stat.badgeClass}`}>
                                {stat.badge}
                            </span>
                            <span className="text-xs text-muted-foreground truncate" title={stat.description}>
                                {stat.description}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Upcoming Deadlines Table */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-emerald-400" />
                                <h2 className="font-semibold text-foreground text-sm">Vencimientos Próximos</h2>
                            </div>
                            <Link href="/procedures" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                                Ver todos
                                <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            {!upcomingExpirations?.length ? (
                                <div className="py-14 px-6 flex flex-col items-center justify-center text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 border border-border/60 text-muted-foreground mb-3">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground">Todos los trámites al día</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                                        No tenés expedientes próximos a vencer en los siguientes 7 días.
                                    </p>
                                    <Link 
                                        href="/procedures" 
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        Explorar expedientes en curso &rarr;
                                    </Link>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground bg-muted/30">
                                            <th className="px-6 py-3 font-medium">Cliente</th>
                                            <th className="px-6 py-3 font-medium">Trámite</th>
                                            <th className="px-6 py-3 font-medium">Vence</th>
                                            <th className="px-6 py-3 font-medium">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {upcomingExpirations.map((item: ProcedureWithClient) => {
                                            const clientName = item.clients?.full_name || 'Desconocido'
                                            const initials = clientName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                            const dateLabel = item.expiration_date ? format(new Date(item.expiration_date), 'dd MMM, HH:mm', { locale: es }) : 'Sin fecha'

                                            return (
                                                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground ring-1 ring-border">
                                                                {initials}
                                                            </div>
                                                            <span className="font-medium text-sm text-foreground">{clientName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.title}</td>
                                                    <td className={`px-6 py-4 text-sm font-medium ${item.expiration_date && new Date(item.expiration_date) < nextWeek ? 'text-red-400' : 'text-foreground'}`}>
                                                        {dateLabel}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="rounded-md bg-muted border border-border px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="flex items-center justify-between border-b border-border/70 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-400" />
                            <h2 className="font-semibold text-foreground text-sm">Actividad Reciente</h2>
                        </div>
                    </div>
                    <div className="flex-1">
                        {!recentActivity?.length ? (
                            <div className="py-14 px-6 flex flex-col items-center justify-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 border border-border/60 text-muted-foreground mb-3">
                                    <Activity className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground">Sin actividad reciente</h3>
                                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                    Las actualizaciones de expedientes y clientes aparecerán en esta sección en tiempo real.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {recentActivity.map((activity: ProcedureWithClient) => (
                                    <div key={activity.id} className="flex gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                                        <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] flex-shrink-0" />
                                        <div className="flex-1 space-y-1 overflow-hidden">
                                            <p className="text-sm font-medium truncate text-foreground">{activity.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                Cliente: <span className="text-foreground font-medium">{activity.clients?.full_name}</span>
                                            </p>
                                            <p className="text-[11px] text-emerald-400/90 font-medium">
                                                {activity.updated_at ? formatDistanceToNow(new Date(activity.updated_at), { addSuffix: true, locale: es }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
