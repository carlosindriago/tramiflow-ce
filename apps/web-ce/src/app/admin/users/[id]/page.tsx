import { Metadata } from 'next'
import { createClient } from '@tramiflow/database/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Database } from '@tramiflow/database/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'
/* eslint-disable */
import { ArrowLeft, User, Shield, AlertTriangle, MonitorSmartphone, Calendar, Mail, Clock, ShieldAlert } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { DangerZonePanel } from './danger-zone-panel'

export const metadata: Metadata = {
    title: 'Detalle de Usuario | Admin',
    description: 'Perfil avanzado y auditoría de usuario',
}

interface PageProps {
    params: {
        id: string
    }
}

export default async function AdminUserDetailPage({ params }: PageProps) {
    const supabase = await createClient()
    const { id } = await params

    const supabaseAdmin = createAdminClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Fetch Auth Identity
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(id)
    if (authError || !authData.user) {
        notFound()
    }
    const authUser = authData.user

    // 2. Fetch Public Profile & Role
    const [profileRes, adminRoleRes, membershipsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('app_admins').select('role').eq('user_id', id).single(),
        supabase.from('organization_members').select('role, created_at, organizations(id, name, slug)').eq('user_id', id)
    ])

    const profile = profileRes.data
    const hasProfile = !!profile
    const adminRole = adminRoleRes.data?.role
    const isBanned = authUser.banned_until ? new Date(authUser.banned_until) > new Date() : false
    const memberships = membershipsRes.data || []

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Header & Breadcrumb */}
            <div className="flex flex-col gap-4">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200 transition-colors w-fit"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Usuarios
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-5">
                        <div className="h-20 w-20 rounded-2xl border border-white/10 bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name || ''} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-10 w-10 text-zinc-600" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
                                {profile?.full_name || 'Sin Nombre'}
                                {adminRole && (
                                    <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-violet-500/20 bg-violet-500/10 text-violet-400 align-middle">
                                        <Shield className="mr-1 h-3 w-3" />
                                        {adminRole}
                                    </span>
                                )}
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-sm text-zinc-400">
                                <span className="flex items-center gap-1.5 bg-zinc-900/50 px-2 py-1 rounded-md border border-white/5">
                                    <Mail className="h-3.5 w-3.5" />
                                    {authUser.email}
                                </span>
                                {isBanned ? (
                                    <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-rose-500/20 bg-rose-500/10 text-rose-500 font-semibold font-mono">
                                        Baneado
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-mono">
                                        Activo
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Metrics & Orgs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Access Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Calendar className="h-4 w-4" />
                                <h3 className="text-sm font-medium">Registro</h3>
                            </div>
                            <div>
                                <div className="text-lg text-zinc-200">
                                    {format(new Date(authUser.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono mt-1">
                                    {formatDistanceToNow(new Date(authUser.created_at), { addSuffix: true, locale: es })}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Clock className="h-4 w-4" />
                                <h3 className="text-sm font-medium">Último Acceso</h3>
                            </div>
                            <div>
                                <div className="text-lg text-zinc-200">
                                    {authUser.last_sign_in_at
                                        ? format(new Date(authUser.last_sign_in_at), "d MMM, HH:mm", { locale: es })
                                        : 'Nunca'
                                    }
                                </div>
                                <div className="text-xs text-zinc-500 font-mono mt-1">
                                    {authUser.last_sign_in_at
                                        ? formatDistanceToNow(new Date(authUser.last_sign_in_at), { addSuffix: true, locale: es })
                                        : '-'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Network Details */}
                    <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-5">
                        <div className="flex items-center gap-2 text-zinc-400 mb-4 border-b border-white/5 pb-3">
                            <MonitorSmartphone className="h-4 w-4" />
                            <h3 className="text-sm font-medium">Datos de Red & Sesión</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">Última IP detectada</p>
                                <p className="font-mono text-sm text-zinc-300 bg-black/20 px-2 py-1 rounded w-fit">
                                    {profile?.last_ip || 'No registrada'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">IP de Registro</p>
                                <p className="font-mono text-sm text-zinc-300 bg-black/20 px-2 py-1 rounded w-fit">
                                    {profile?.registration_ip || 'No registrada'}
                                </p>
                            </div>
                            <div className="col-span-2 mt-2">
                                <p className="text-xs text-zinc-500 mb-1">Auth Providers</p>
                                <div className="flex gap-2">
                                    {authUser.app_metadata.providers?.map((p: string) => (
                                        <span key={p} className="text-xs bg-white/5 text-zinc-300 px-2 py-1 rounded border border-white/10 capitalize">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Memberships */}
                    <div className="rounded-xl border border-white/5 bg-zinc-900/20 overflow-hidden">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-900/40">
                            <h2 className="text-lg font-semibold text-zinc-100">Organizaciones</h2>
                        </div>
                        <div className="p-0">
                            {memberships.length === 0 ? (
                                <div className="text-sm text-zinc-500 text-center py-8">
                                    No pertenece a ninguna organización.
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
/* eslint-disable */
                                    {memberships.map((membership: any) => (
                                        <div key={membership.organizations.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
                                            <div>
                                                <Link href={`/admin/orgs/${membership.organizations.id}`} className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                                                    {membership.organizations.name}
                                                </Link>
                                                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                                                    {membership.organizations.slug || membership.organizations.id.slice(0, 8)}
                                                </div>
                                            </div>
                                            <span className="text-[10px] uppercase font-mono px-2 py-1 rounded border border-white/10 bg-white/5 text-zinc-300">
                                                {membership.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Danger Zone */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.02] overflow-hidden relative">
                        {/* Subtle red glow */}
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>

                        <div className="p-5 border-b border-rose-500/10 flex items-center gap-2 bg-rose-500/5">
                            <ShieldAlert className="h-5 w-5 text-rose-500" />
                            <h2 className="text-lg font-semibold text-rose-500">Zona de Peligro</h2>
                        </div>

                        <div className="p-5 space-y-6">
                            <DangerZonePanel
                                userId={authUser.id}
                                userEmail={authUser.email!}
                                isBanned={isBanned}
                                hasProfile={hasProfile}
                                hasOrg={memberships.length > 0}
                                isAdmin={!!adminRole}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
