'use client'

import { useHeartbeat } from '@/hooks/use-heartbeat'

/**
 * HeartbeatProvider — thin client wrapper that fires POST /api/heartbeat
 * on mount and every 5 minutes. Include this in the dashboard layout.
 */
export function HeartbeatProvider() {
    useHeartbeat()
    return null // renders nothing
}
