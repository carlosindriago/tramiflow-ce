'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { createClient } from '@carlosindriago/database/client'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    Button,
    Badge,
    ScrollArea,
} from '@carlosindriago/ui'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error' | string
    link?: string | null
    is_read: boolean | null
    created_at: string | null
}

export function NotificationsBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()

    const handleNotificationClick = useCallback(async (notification: Notification) => {
        if (!notification.is_read) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
            await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id)
        }
        setIsOpen(false)
        if (notification.link) {
            router.push(notification.link)
        }
    }, [router, supabase])

    const handleNewNotification = useCallback((notification: Notification) => {
        setNotifications((prev) => [notification, ...prev])
        setUnreadCount((prev) => prev + 1)
        toast(notification.title, {
            description: notification.message,
            action: {
                label: 'Ver',
                onClick: () => handleNotificationClick(notification),
            },
        })
    }, [handleNotificationClick])

    const fetchNotifications = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) throw error

            setNotifications(data || [])
            setUnreadCount(data?.filter((n) => !n.is_read).length || 0)
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchNotifications()

        let channel: ReturnType<typeof supabase.channel> | null = null

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            channel = supabase
                .channel(`notifications:${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        handleNewNotification(payload.new as Notification)
                    }
                )
                .subscribe()
        }

        setupRealtime()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [fetchNotifications, handleNewNotification, supabase])

    const markAllAsRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
        await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-in zoom-in"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl border border-border bg-popover shadow-xl" align="end">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h4 className="font-semibold text-sm text-foreground">Notificaciones</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-muted-foreground hover:text-emerald-400"
                            onClick={markAllAsRead}
                        >
                            Marcar leídas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground gap-2 py-8">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" /> Cargando...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                            <Bell className="h-8 w-8 mb-2 opacity-30 text-muted-foreground" />
                            <p className="text-sm">No tienes notificaciones</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3 ${!notification.is_read ? 'bg-muted/20' : ''
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notification.is_read ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-transparent'
                                        }`} />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none text-foreground">
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground pt-1">
                                            {notification.created_at && formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                                locale: es,
                                            })}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
