import { createClient } from '@/lib/supabase/server'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { OrgActionsMenu } from './org-actions-menu'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import type { AdminRole } from '@/types/admin'

const statusConfig: Record<string, { label: string; class: string }> = {
    active: { label: 'Activo', class: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
    trialing: { label: 'Trial', class: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
    past_due: { label: 'Vencido', class: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10' },
    canceled: { label: 'Bloqueado', class: 'text-rose-400 border-rose-500/20 bg-rose-500/10' },
}

const planConfig: Record<string, { label: string; class: string }> = {
    pro: { label: 'PRO', class: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 font-bold' },
    free: { label: 'Free', class: 'text-zinc-400 border-white/10 bg-white/5 font-medium' },
}

interface SearchParams {
    q?: string
}

export default async function AdminOrgsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const supabase = await createClient()
    const params = await searchParams
    const query = params.q ?? ''

    // Get admin role
    const { data: { user } } = await supabase.auth.getUser()
    const { data: admin } = await supabase
        .from('app_admins')
        .select('role')
        .eq('user_id', user!.id)
        .single()
    const adminRole: AdminRole = admin?.role ?? 'analyst'

    // Fetch organizations
    let orgsQuery = supabase
        .from('organizations')
        .select('id, name, slug, plan_tier, status, trial_ends_at, subscription_ends_at, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

    if (query) {
        orgsQuery = orgsQuery.ilike('name', `%${query}%`)
    }

    const { data: orgs } = await orgsQuery

    function formatDate(date: string | null) {
        if (!date) return '—'
        return format(new Date(date), 'dd MMM yyyy', { locale: es })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Organizaciones</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {orgs?.length ?? 0} organización(es)
                    </p>
                </div>
            </div>

            {/* Search */}
            <form className="flex gap-2 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        name="q"
                        defaultValue={query}
                        placeholder="Buscar por nombre..."
                        className="pl-9"
                    />
                </div>
            </form>

            {/* Table */}
            <div className="rounded-xl border border-white/5 bg-zinc-900/20 overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                    <thead className="bg-zinc-900/50 border-b border-white/5">
                        <tr>
                            {['Organización', 'Plan', 'Estado', 'Trial / Vence', 'Antigüedad', ''].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-[10px] uppercase font-semibold text-zinc-500 tracking-widest whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {orgs?.map(org => {
                            const plan = planConfig[org.plan_tier] ?? planConfig.free
                            const status = statusConfig[org.status] ?? statusConfig.trialing
                            const vencimiento = org.status === 'trialing'
                                ? formatDate(org.trial_ends_at)
                                : formatDate(org.subscription_ends_at)

                            return (
                                <tr key={org.id} className="hover:bg-zinc-900/40 transition-colors group">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/orgs/${org.id}`} className="block group-hover:text-emerald-400 transition-colors">
                                            <div className="font-medium text-zinc-100 whitespace-nowrap group-hover:text-emerald-400">{org.name}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono mt-0.5">{org.slug ?? org.id.slice(0, 8)}</div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${plan.class}`}>
                                            {plan.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${status.class}`}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">{vencimiento}</td>
                                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">
                                        {formatDate(org.created_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <OrgActionsMenu
                                            orgId={org.id}
                                            orgName={org.name}
                                            adminRole={adminRole}
                                            planTier={org.plan_tier}
                                            orgStatus={org.status}
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                        {(!orgs || orgs.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                                    No se encontraron organizaciones.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
