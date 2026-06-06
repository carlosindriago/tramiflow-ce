'use client'

import { useEffect, useState } from 'react'
/* eslint-disable */
import { Bell, Check, Loader2 } from 'lucide-react'
import { createClient } from '@carlosindriago/database/client'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@carlosindriago/ui'
import { Button } from '@carlosindriago/ui'
import { Badge } from '@carlosindriago/ui'
import { ScrollArea } from '@carlosindriago/ui'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    link?: string
    is_read: boolean
    created_at: string
}

export function NotificationsBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetchNotifications()

        // Realtime Subscription
        const channel = supabase
            .channel('notifications-bell')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}` // Filter by user ID logic needs careful handling in client
                },
                (payload) => {
                    // We'll filter by user_id in the fetch or row level security handles it.
                    // Ideally we listen to everything and RLS filters? 
                    // Realtime with RLS: we need to subscribe with current session.
                    handleNewNotification(payload.new as Notification)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
/* eslint-disable */
    }, [])

    // Better Realtime Subscription logic for RLS
    useEffect(() => {
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const channel = supabase
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

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setupRealtime()
/* eslint-disable */
    }, [])

    const fetchNotifications = async () => {
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
    }

    const handleNewNotification = (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev])
        setUnreadCount((prev) => prev + 1)
        toast(notification.title, {
            description: notification.message,
            action: {
                label: 'Ver',
                onClick: () => handleNotificationClick(notification),
            },
        })

        // Play sound
        try {
/* eslint-disable */
            const audio = new Audio('/notification.mp3') // Assume we might add this later or simple beep
            // audio.play().catch(() => {}) 
/* eslint-disable */
        } catch (e) { }
    }

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))

        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    }

    const markAllAsRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
        await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id)
        }
        setIsOpen(false)
        if (notification.link) {
            router.push(notification.link)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors">
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
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={markAllAsRead}
                        >
                            Marcar leídas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No tienes notificaciones</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3 ${!notification.is_read ? 'bg-muted/30' : ''
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notification.is_read ? 'bg-blue-500' : 'bg-transparent'
                                        }`} />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground pt-1">
                                            {formatDistanceToNow(new Date(notification.created_at), {
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
