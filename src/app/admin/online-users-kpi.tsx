/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Wifi, X, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface OnlineUser {
    id: string
    full_name: string | null
    avatar_url: string | null
    last_seen_at: string
    organization_name: string | null
}

const ONLINE_THRESHOLD_MINUTES = 10
const POLL_INTERVAL_MS = 30_000 // 30 seconds

export function OnlineUsersKPI() {
    const [users, setUsers] = useState<OnlineUser[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    const fetchOnlineUsers = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/admin/online-users?minutes=${ONLINE_THRESHOLD_MINUTES}`,
                { cache: 'no-store' }
            )
            if (res.ok) {
                const json = await res.json()
                setUsers(json.users ?? [])
            }
        } catch {
            // silent fail
        }
        setLastRefresh(new Date())
        setLoading(false)
    }, [])

  // Initial fetch + polling
  useEffect(() => {
    // fetchOnlineUsers is async (useCallback) — setState calls happen asynchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOnlineUsers()
    const interval = setInterval(fetchOnlineUsers, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchOnlineUsers])

    const count = users.length

    return (
        <>
            {/* KPI Card — clickable */}
            <button
                onClick={() => setOpen(true)}
                className="group relative bg-zinc-900/50 border border-white/5 rounded-xl p-6 text-left hover:bg-zinc-900/80 transition-colors duration-200 cursor-pointer w-full"
            >
                <div className="flex justify-between items-start pb-2 pt-1">
                    <div className="text-[10px] uppercase font-semibold tracking-widest text-zinc-500">
                        Usuarios Online
                    </div>
                    <Users className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <div className="text-4xl font-mono font-medium tabular-nums tracking-tighter text-zinc-50">
                        {loading ? (
                            <span className="text-zinc-700 animate-pulse">—</span>
                        ) : count}
                    </div>
                    {/* Pulsing LED dot */}
                    <span className="relative flex h-2 w-2">
                        {count > 0 && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 shadow-sm ${count > 0 ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                    </span>
                </div>

                <div className="text-xs text-zinc-500/80 mt-2 font-medium">Últimos {ONLINE_THRESHOLD_MINUTES} min · click para ver</div>
            </button>

            {/* Slide-over panel */}
            {open && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Panel */}
                    <div className="relative w-full max-w-md bg-background border-l border-border flex flex-col h-full shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <div>
                                <h2 className="font-semibold text-base flex items-center gap-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                        {count > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${count > 0 ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                                    </span>
                                    {count} usuarios online
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Activos en los últimos {ONLINE_THRESHOLD_MINUTES} minutos
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchOnlineUsers}
                                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                    title="Actualizar"
                                >
                                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                </button>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* User list */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loading ? (
                                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                                    Cargando...
                                </div>
                            ) : users.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                    <Wifi className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">Ningún usuario activo ahora mismo</p>
                                </div>
                            ) : (
                                users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <div className="relative">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt={user.full_name ?? ''}
                                                    className="h-9 w-9 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                                                    {(user.full_name ?? '?')[0].toUpperCase()}
                                                </div>
                                            )}
                                            {/* Online dot */}
                                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {user.full_name ?? 'Usuario sin nombre'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user.organization_name ?? 'Sin organización'}
                                            </p>
                                        </div>

                                        {/* Last seen */}
                                        <div className="text-xs text-emerald-400 whitespace-nowrap shrink-0">
                                            {formatDistanceToNow(new Date(user.last_seen_at), {
                                                addSuffix: true,
                                                locale: es,
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground/60 text-center">
                            Actualización automática cada 30 s · Última:{' '}
                            {formatDistanceToNow(lastRefresh, { addSuffix: true, locale: es })}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
