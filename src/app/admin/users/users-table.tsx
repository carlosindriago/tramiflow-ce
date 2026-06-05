'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fixMissingProfile } from '../actions'
/* eslint-disable */
import { fixUserOrganization, toggleUserBan } from './actions'
import { DeleteUserDialog } from './delete-user-dialog'
import { BanUserDialog } from './ban-user-dialog'
import { toast } from 'sonner'
/* eslint-disable */
import { MoreHorizontal, Ban, Trash2, Building2, Search, UserCheck } from 'lucide-react'

type AdminUser = {
    id: string
    email: string
    created_at: string
    last_sign_in_at: string | null
    full_name: string | null
    avatar_url: string | null
    organization_name: string | null
    organization_id: string | null
    admin_role: string | null
    last_ip: string | null
    is_banned?: boolean
}

export function UsersTable({ users }: { users: AdminUser[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [orgFilter, setOrgFilter] = useState<string>('all')

    const uniqueOrgs = Array.from(new Set(users.map(u => u.organization_name).filter(Boolean))) as string[]

    const filteredUsers = users.filter(user => {
        if (orgFilter === 'all') return true
        if (orgFilter === 'unassigned') return !user.organization_name
        return user.organization_name === orgFilter
    })

    const handleSearch = (term: string) => {
        setSearch(term)
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        router.replace(`?${params.toString()}`)
    }

    const handleFixProfile = async (userId: string) => {
        setLoadingId(userId)
        const res = await fixMissingProfile(userId)
        setLoadingId(null)

        if (res.success) {
            toast.success(res.message)
            router.refresh()
        } else {
            toast.error(res.error)
        }
    }

    const handleFixOrg = async (userId: string) => {
        try {
            setLoadingId(userId)
            const res = await fixUserOrganization(userId)

            if (res.success) {
                toast.success(res.message)
                router.refresh()
            } else {
                toast.error(res.error || 'Server returned an error')
            }
/* eslint-disable */
        } catch (error: any) {
            toast.error(error.message || 'Error de conexión o fallo del servidor')
        } finally {
            setLoadingId(null)
        }
    }

    const [userToDelete, setUserToDelete] = useState<{ id: string, email: string } | null>(null)
    const [userToBan, setUserToBan] = useState<{ id: string, email: string, isBanned: boolean } | null>(null)

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por email, nombre o ID..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9 bg-transparent"
                    />
                </div>

                <Select value={orgFilter} onValueChange={setOrgFilter}>
                    <SelectTrigger className="w-[200px] bg-transparent border-white/10 text-zinc-300">
                        <SelectValue placeholder="Filtrar por Org" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-white/10">
                        <SelectItem value="all">Todas las Orgs</SelectItem>
                        <SelectItem value="unassigned" className="text-amber-400">Sin Organización</SelectItem>
                        {uniqueOrgs.map(org => (
                            <SelectItem key={org} value={org}>{org}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-xl border border-white/5 bg-zinc-900/20 overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                    <thead className="bg-zinc-900/50 border-b border-white/5">
                        <tr>
                            <th className="text-left px-4 py-3 text-[10px] uppercase font-semibold text-zinc-500 tracking-widest whitespace-nowrap">Usuario</th>
                            <th className="text-left px-4 py-3 text-[10px] uppercase font-semibold text-zinc-500 tracking-widest whitespace-nowrap">Rol / Org</th>
                            <th className="text-left px-4 py-3 text-[10px] uppercase font-semibold text-zinc-500 tracking-widest whitespace-nowrap">Registro</th>
                            <th className="text-left px-4 py-3 text-[10px] uppercase font-semibold text-zinc-500 tracking-widest whitespace-nowrap">Último Acceso</th>
                            <th className="text-left px-4 py-3 text-[10px] uppercase font-semibold text-zinc-500 tracking-widest whitespace-nowrap">Estado</th>
                            <th className="text-right px-4 py-3 text-[10px] uppercase font-semibold text-zinc-500 tracking-widest whitespace-nowrap"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((user) => {
                            const hasProfile = !!user.full_name
                            const hasOrg = !!user.organization_name

                            return (
                                <tr key={user.id} className="hover:bg-zinc-900/40 transition-colors group">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 group/link">
                                            <Avatar className="h-8 w-8 rounded-md border border-white/10 group-hover/link:border-emerald-500/50 transition-colors">
                                                <AvatarImage src={user.avatar_url || ''} />
                                                <AvatarFallback className="bg-zinc-800 text-zinc-300 rounded-md">
                                                    {user.full_name ? (
                                                        user.full_name.slice(0, 2).toUpperCase()
                                                    ) : (
                                                        <User className="h-4 w-4" />
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-zinc-100 whitespace-nowrap group-hover/link:text-emerald-400 transition-colors">
                                                    {user.full_name || 'Sin Nombre'}
                                                </span>
                                                <span className="text-[10px] uppercase font-mono tracking-widest mt-0.5 text-zinc-500 group-hover/link:text-zinc-400 transition-colors">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1.5 items-start">
                                            {user.admin_role && (
                                                <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-violet-500/20 bg-violet-500/10 text-violet-400">
                                                    <Shield className="mr-1 h-3 w-3" />
                                                    {user.admin_role}
                                                </span>
                                            )}
                                            {user.organization_name ? (
                                                <Link href={`/admin/orgs/${user.organization_id}`} className="text-sm font-medium text-zinc-300 hover:text-emerald-400 transition-colors">
                                                    {user.organization_name}
                                                </Link>
                                            ) : (
                                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                                                    Sin Organización
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span>{user.last_sign_in_at ? (
                                                formatDistanceToNow(new Date(user.last_sign_in_at), {
                                                    addSuffix: true,
                                                    locale: es,
                                                })
                                            ) : (
                                                <span className="text-zinc-600">-</span>
                                            )}</span>
                                            {user.last_ip && (
                                                <span className="text-[10px] text-zinc-600 mt-1">IP: {user.last_ip}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.is_banned ? (
                                            <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-rose-500/20 bg-rose-500/10 text-rose-500 font-semibold truncate">
                                                <Ban className="h-3 w-3 mr-1" />
                                                Baneado
                                            </span>
                                        ) : !hasProfile ? (
                                            <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Sin Perfil
                                            </span>
                                        ) : !hasOrg && !user.admin_role ? (
                                            <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                                Sin Org
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                OK
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {!hasProfile && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleFixProfile(user.id)}
                                                    disabled={loadingId === user.id}
                                                    className="border-rose-500/20 text-rose-400 bg-transparent hover:bg-rose-500/10 hover:text-rose-300 h-8 text-xs"
                                                >
                                                    {loadingId === user.id ? 'Corrigiendo...' : 'Corregir Perfil'}
                                                </Button>
                                            )}
                                            {hasProfile && !hasOrg && !user.admin_role && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleFixOrg(user.id)}
                                                    disabled={loadingId === user.id}
                                                    className="border-amber-500/20 text-amber-400 bg-transparent hover:bg-amber-500/10 hover:text-amber-300 h-8 text-xs"
                                                >
                                                    <Building2 className="h-3 w-3 mr-1.5" />
                                                    {loadingId === user.id ? 'Reparando...' : 'Reparar Org'}
                                                </Button>
                                            )}

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={loadingId === user.id} className="h-8 w-8 hover:bg-white/5 data-[state=open]:bg-white/5">
                                                        <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border-white/10 text-zinc-300">
                                                    <DropdownMenuItem
                                                        onClick={() => setUserToBan({
                                                            id: user.id,
                                                            email: user.email,
                                                            isBanned: !!user.is_banned
                                                        })}
                                                        className="hover:bg-white/5 cursor-pointer"
                                                    >
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        <span>{user.is_banned ? 'Quitar Ban' : 'Banear Usuario'}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                    <DropdownMenuItem
                                                        onClick={() => setUserToDelete({ id: user.id, email: user.email })}
                                                        className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer focus:text-rose-300 focus:bg-rose-500/10"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Eliminar Usuario</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="h-24 text-center text-zinc-500">
                                    No se encontraron usuarios iterando el filtro seleccionado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <BanUserDialog
                isOpen={!!userToBan}
                onOpenChange={(open) => !open && setUserToBan(null)}
                userId={userToBan?.id || ''}
                userEmail={userToBan?.email || ''}
                isCurrentlyBanned={userToBan?.isBanned || false}
            />

            {userToDelete && (
                <DeleteUserDialog
                    isOpen={!!userToDelete}
                    onOpenChange={(open) => !open && setUserToDelete(null)}
                    userId={userToDelete.id}
                    userEmail={userToDelete.email}
                />
            )}
        </div>
    )
}
