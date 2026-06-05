import { createClient } from '@tramiflow/database/server'
import { Building2, Users, Crown, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@tramiflow/ui'
import { OnlineUsersKPI } from './online-users-kpi'

interface KPICardProps {
    title: string
    value: number | string
    icon: React.ElementType
    description?: string
    color?: string
}

function KPICard({ title, value, icon: Icon, description, color = 'bg-zinc-500' }: KPICardProps) {
    return (
        <Card className="bg-zinc-900/50 border-white/5 shadow-none rounded-xl overflow-hidden relative group transition-colors hover:bg-zinc-900/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
                <CardTitle className="text-[10px] uppercase font-semibold tracking-widest text-zinc-500">{title}</CardTitle>
                <Icon className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3">
                    <p className="text-4xl font-mono font-medium tracking-tighter text-zinc-50">{value}</p>
                    <div className={`h-2 w-2 rounded-full ${color} shadow-sm`} />
                </div>
                {description && (
                    <p className="text-xs text-zinc-500 mt-2 font-medium">{description}</p>
                )}
            </CardContent>
        </Card>
    )
}

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // Get admin role from layout data attribute (passed via server query)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: admin } = await supabase
        .from('app_admins')
        .select('role')
        .eq('user_id', user!.id)
        .single()

    // KPI queries in parallel
    const [totalOrgs, proOrgs, freeOrgs, expiredOrgs] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('organizations').select('id', { count: 'exact', head: true })
            .eq('plan_tier', 'pro').eq('status', 'active'),
        supabase.from('organizations').select('id', { count: 'exact', head: true })
            .eq('plan_tier', 'free'),
        supabase.from('organizations').select('id', { count: 'exact', head: true })
            .eq('status', 'past_due'),
    ])

    // Recent events (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { count: recentEvents } = await supabase
        .from('usage_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())

    const isSuperAdmin = admin?.role === 'super_admin'

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Panel de control del sistema TramiFlow.
                </p>
            </div>

            {/* Financial KPIs — only for super_admin */}
            {isSuperAdmin && (
                <>
                    <section>
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                            Suscripciones
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <KPICard
                                title="Total Organizaciones"
                                value={totalOrgs.count ?? 0}
                                icon={Building2}
                            />
                            <KPICard
                                title="Usuarios PRO"
                                value={proOrgs.count ?? 0}
                                icon={Crown}
                                color="bg-emerald-500"
                                description="Plan activo"
                            />
                            <KPICard
                                title="Usuarios Free"
                                value={freeOrgs.count ?? 0}
                                icon={Users}
                                color="bg-zinc-500"
                            />
                            <KPICard
                                title="Vencidos / Past Due"
                                value={expiredOrgs.count ?? 0}
                                icon={AlertTriangle}
                                color="bg-rose-500"
                                description="Necesitan atención"
                            />
                        </div>
                    </section>
                </>
            )}

            {/* Usage KPIs — visible for all admins */}
            <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Actividad en tiempo real
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Online users — client component with 30s polling */}
                    <OnlineUsersKPI />

                    <KPICard
                        title="Eventos Registrados (7 días)"
                        value={recentEvents ?? 0}
                        icon={Users}
                        color="bg-violet-500"
                    />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                    Ver detalle completo en{' '}
                    <a href="/admin/analytics" className="underline text-violet-400 hover:text-violet-300">
                        Analytics →
                    </a>
                </p>
            </section>
        </div>
    )
}
