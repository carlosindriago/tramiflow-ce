'use client'

import { useEffect } from 'react'

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * useHeartbeat — fires POST /api/heartbeat on mount and every 5 minutes.
 * Add this hook to the main dashboard layout so it runs for all authenticated users.
 */
export function useHeartbeat() {
    useEffect(() => {
        const ping = () => {
            fetch('/api/heartbeat', { method: 'POST' }).catch(() => {
                // silent fail — network issues shouldn't break the UI
            })
        }

        // Ping immediately on mount
        ping()

        const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [])
}
