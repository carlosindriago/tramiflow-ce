/* eslint-disable @next/next/no-img-element */
import { Suspense } from 'react'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Users, FileText, HardDrive, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getOrgMembers } from './actions'
import { OrgMembersClientTable } from './org-members-client-table'
import { OrgSettingsPanel } from './org-settings-panel'

export const metadata: Metadata = {
    title: 'Detalle de Organización | Admin',
    description: 'Gestión 360 de la organización',
}

interface PageProps {
    params: {
        id: string
    }
}

const statusConfig: Record<string, { label: string; class: string }> = {
    active: { label: 'Activo', class: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
    trialing: { label: 'Trial', class: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
    past_due: { label: 'Vencido', class: 'text-rose-400 border-rose-500/20 bg-rose-500/10' },
    canceled: { label: 'Cancelado', class: 'text-zinc-400 border-white/10 bg-white/5' },
    incomplete: { label: 'Incompleto', class: 'text-blue-400 border-blue-500/20 bg-blue-500/10' }
}

const planConfig: Record<string, { label: string; class: string }> = {
    free: { label: 'Gratis', class: 'text-zinc-300 border-white/10 bg-white/5' },
    pro: { label: 'Profesional', class: 'text-violet-400 border-violet-500/20 bg-violet-500/10' },
    enterprise: { label: 'Enterprise', class: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' }
}

export default async function AdminOrgDetailPage({ params }: PageProps) {
    const supabase = await createClient()
    const { id } = await params

    // 1. Fetch organization details
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

    if (orgError || !org) {
        notFound()
    }

    // 2. Fetch Metrics, Billing & Members, and Plan Limits
    const [clientsRes, proceduresRes, paymentsRes, members, limitsRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('organization_id', id),
        supabase.from('procedures').select('id', { count: 'exact', head: true }).eq('organization_id', id),
        supabase.from('payment_reports').select('*').eq('organization_id', id).order('created_at', { ascending: false }).limit(5),
        getOrgMembers(id),
        supabase.from('subscription_plans').select('*').eq('code', org.plan_tier).single()
    ])

    const totalClients = clientsRes.count || 0
    const totalProcedures = proceduresRes.count || 0
    const payments = paymentsRes.data || []
    const limits = limitsRes.data || { max_clients: 0, max_procedures: 0, max_storage_mb: 0 }

    const plan = planConfig[org.plan_tier] ?? planConfig.free
    const status = statusConfig[org.status] ?? statusConfig.trialing

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Header & Breadcrumb */}
            <div className="flex flex-col gap-4">
                <Link
                    href="/admin/orgs"
                    className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200 transition-colors w-fit"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Organizaciones
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl border border-white/10 bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                            {org.logo_url ? (
                                <img src={org.logo_url} alt={org.name} className="h-full w-full object-cover" />
                            ) : (
                                <Building2 className="h-8 w-8 text-zinc-600" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{org.name}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${status.class}`}>
                                    {status.label}
                                </span>
                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${plan.class}`}>
                                    {plan.label}
                                </span>
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                                    {org.slug || org.id.slice(0, 8)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-zinc-400 mb-4">
                        <Users className="h-4 w-4" />
                        <h3 className="text-sm font-medium">Total Clientes</h3>
                    </div>
                    <div className="flex items-baseline gap-2 text-4xl font-light tracking-tight font-mono text-zinc-100">
                        {totalClients}
                        <span className="text-lg text-zinc-500">/ {limits.max_clients >= 999999 ? '∞' : limits.max_clients}</span>
                    </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-zinc-400 mb-4">
                        <FileText className="h-4 w-4" />
                        <h3 className="text-sm font-medium">Trámites Creados</h3>
                    </div>
                    <div className="flex items-baseline gap-2 text-4xl font-light tracking-tight font-mono text-zinc-100">
                        {totalProcedures}
                        <span className="text-lg text-zinc-500">/ {limits.max_procedures >= 999999 ? '∞' : limits.max_procedures}</span>
                    </div>
                </div>

                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-emerald-500/70 mb-4">
                        <HardDrive className="h-4 w-4" />
                        <h3 className="text-sm font-medium">Almacenamiento</h3>
                    </div>
                    <div className="text-4xl font-light tracking-tight font-mono text-emerald-400/90">
                        — <span className="text-xl text-emerald-500/50">MB</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Users */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border border-white/5 bg-zinc-900/20 overflow-hidden">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-900/40">
                            <div>
                                <h2 className="text-lg font-semibold text-zinc-100">Miembros del Equipo</h2>
                                <p className="text-xs text-zinc-500 mt-1">Usuarios con acceso a este entorno.</p>
                            </div>
                        </div>
                        <div className="p-0">
                            <Suspense fallback={<div className="p-6 text-center text-sm text-zinc-500">Cargando miembros...</div>}>
{/* eslint-disable */}
                                <OrgMembersClientTable members={members as any} orgId={id} />
                            </Suspense>
                        </div>
                    </div>
                </div>

                {/* Right Column: Billing */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-white/5 bg-zinc-900/20 overflow-hidden">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-900/40">
                            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-zinc-400" />
                                Historial de Pagos
                            </h2>
                        </div>
                        <div className="p-0">
                            {payments.length === 0 ? (
                                <div className="text-sm text-zinc-500 text-center py-8">
                                    No hay pagos registrados.
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {payments.map(payment => (
                                        <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
                                            <div>
                                                <div className="font-medium text-zinc-200">{payment.amount} {payment.currency}</div>
                                                <div className="text-xs text-zinc-500 font-mono mt-0.5">{format(new Date(payment.created_at), 'dd MMM yyyy', { locale: es })}</div>
                                            </div>
                                            <div>
                                                <span className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${payment.status === 'completed' || payment.status === 'approved'
                                                    ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                                                    : payment.status === 'pending'
                                                        ? 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                                                        : 'text-rose-400 border-rose-500/20 bg-rose-500/10'
                                                    }`}>
                                                    {payment.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuración Avanzada */}
            <div className="mt-8">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-zinc-100">Control de Organización</h2>
                    <p className="text-sm text-zinc-500">Acciones administrativas avanzadas, facturación y seguridad.</p>
                </div>
                <OrgSettingsPanel
                    orgId={org.id}
                    currentName={org.name}
                    currentPlan={org.plan_tier}
                    isBanned={org.status === 'canceled'}
                />
            </div>
        </div>
    )
}
