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

    // 1. Get Organization (Assume first one found)
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

    // Start of current day for "Leads Today"
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()

    // 30 Days Expiration
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
        // KPI: Total Clients
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),

        // KPI: Active Procedures
        supabase.from('procedures').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .neq('status', 'completed')
            .neq('status', 'archived'),

        // KPI: Expiring Soon (7 days)
        supabase.from('procedures').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('expiration_date', today.toISOString())
            .lte('expiration_date', nextWeek.toISOString()),

        // KPI: Expiring Soon (30 days)
        supabase.from('procedures').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('expiration_date', today.toISOString())
            .lte('expiration_date', next30Days.toISOString()),

        // KPI: Attended Month
        supabase.from('procedures').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('updated_at', new Date(today.getFullYear(), today.getMonth(), 1).toISOString()),

        // List: Recent Activity
        supabase.from('procedures').select('*, clients(full_name)')
            .eq('organization_id', orgId)
            .order('updated_at', { ascending: false })
            .limit(5),

        // List: Upcoming Expirations
        supabase.from('procedures').select('*, clients(full_name)')
            .eq('organization_id', orgId)
            .gte('expiration_date', today.toISOString())
            .order('expiration_date', { ascending: true })
            .limit(5),

        // KPI: Leads Stats (Month)
        getLeadsStats(),

        // KPI: Leads Today
        supabase.from('leads').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('created_at', startOfDay),

        // KPI: Page Views
        supabase.from('organizations').select('page_views').eq('id', orgId).single()
    ])

    // 3. Process Data for UI
    const stats = [
        // Fila 1: Marketing / Crecimiento
        {
            title: 'Visitas Perfil',
            value: orgData?.page_views || 0,
            badge: 'Total',
            badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
            description: 'Vistas del perfil público',
            icon: Eye,
            textColor: 'text-emerald-500',
        },
        {
            title: 'Leads Hoy',
            value: leadsToday || 0,
            badge: 'Hoy',
            badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
            description: 'Potenciales clientes nuevos',
            icon: Zap,
            textColor: 'text-amber-500',
        },
        {
            title: 'Leads Mes',
            value: leadsStats.value,
            badge: leadsStats.trend === 'up' ? 'Subiendo' : 'Bajando',
            badgeColor: leadsStats.trend === 'up' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
            description: leadsStats.description,
            icon: TrendingUp,
            textColor: 'text-emerald-500',
        },
        {
            title: 'Total Clientes',
            value: totalClients || 0,
            badge: 'Base',
            badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
            description: 'Cartera total',
            icon: UserPlus,
            textColor: 'text-sky-500',
        },

        // Fila 2: Operaciones / Gestión
        {
            title: 'Trámites Activos',
            value: activeProcedures || 0,
            badge: 'En curso',
            badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
            description: 'En gestión actualmente',
            icon: FileText,
            textColor: 'text-emerald-500',
        },
        {
            title: 'Actividad Mes',
            value: attendedMonth || 0,
            badge: 'Gestión',
            badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
            description: 'Movimientos este mes',
            icon: Activity,
            textColor: 'text-cyan-500',
        },
        {
            title: 'Vencen (7 Días)',
            value: expiringSoon || 0,
            badge: (expiringSoon || 0) > 0 ? 'Crítico' : 'Ok',
            badgeColor: (expiringSoon || 0) > 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
            description: 'Atención prioritaria',
            icon: AlertTriangle,
            textColor: (expiringSoon || 0) > 0 ? 'text-red-500' : 'text-emerald-500',
        },
        {
            title: 'Vencen (30 Días)',
            value: expiringMonth || 0,
            badge: 'Proyección',
            badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
            description: 'Próximo mes',
            icon: Calendar,
            textColor: 'text-amber-500',
        }
    ]

    const isFirstTime = (totalClients || 0) === 0 && (activeProcedures || 0) === 0

    return (
        <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-700">
            {/* Welcome Banner (Aha Moment) */}
            {isFirstTime && (
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card p-6 md:p-8 shadow-sm">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight leading-tight">
                                👋 ¡Bienvenido a TramiFlow, {user.email?.split('@')[0]}!
                            </h2>
                            <p className="text-muted-foreground max-w-xl text-sm md:text-base leading-relaxed">
                                Tu centro de comando está listo. Empecemos a organizar tus trámites para que nunca más se te pase un vencimiento.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link 
                                href="/templates/new" 
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
                            >
                                <FileText className="h-4 w-4" />
                                1. Crear Plantilla
                            </Link>
                            <Link 
                                href="/clients/new" 
                                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground border border-border hover:bg-secondary/80 transition-all active:scale-95"
                            >
                                <UserPlus className="h-4 w-4" />
                                2. Agregar Cliente
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid 4x2 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div
                        key={stat.title}
                        className="rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:scale-[1.01] hover:border-border/80 shadow-sm animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {stat.title}
                            </span>
                            <div className={`p-2 rounded-lg bg-muted/60`}>
                                <stat.icon className={`h-4 w-4 ${stat.textColor}`} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
                                {stat.value}
                            </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${stat.badgeColor} shadow-sm`}>
                                {stat.badge}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={stat.description}>
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
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="font-semibold text-foreground">Vencimientos Próximos</h2>
                            <Link href="/procedures" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline transition-colors">
                                Ver todos
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
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
                                    {!upcomingExpirations?.length && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-muted-foreground text-sm italic">
                                                No hay vencimientos próximos
                                            </td>
                                        </tr>
                                    )}
                                    {upcomingExpirations?.map((item: ProcedureWithClient) => {
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
                                                <td className={`px-6 py-4 text-sm font-medium ${item.expiration_date && new Date(item.expiration_date) < nextWeek ? 'text-red-500' : 'text-foreground'}`}>
                                                    {dateLabel}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent Activity (Updates) */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden h-fit">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                        <h2 className="font-semibold text-foreground">Actividad Reciente</h2>
                    </div>
                    <div className="divide-y divide-border">
                        {!recentActivity?.length && (
                            <div className="p-8 text-center text-muted-foreground text-sm italic">
                                Sin actividad reciente
                            </div>
                        )}
                        {recentActivity?.map((activity: ProcedureWithClient) => (
                            <div key={activity.id} className="flex gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                                <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] flex-shrink-0" />
                                <div className="flex-1 space-y-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate text-foreground">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        Cliente: <span className="text-foreground">{activity.clients?.full_name}</span>
                                    </p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                        {activity.updated_at ? formatDistanceToNow(new Date(activity.updated_at), { addSuffix: true, locale: es }) : '-'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
