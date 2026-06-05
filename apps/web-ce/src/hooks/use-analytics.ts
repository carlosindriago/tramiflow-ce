'use client'

import { useCallback } from 'react'
import { createClient } from '@tramiflow/database/client'

/**
 * Fire-and-forget analytics tracking.
 * Calls /api/analytics/track without blocking the UI.
 */
export function useAnalytics() {
    const trackEvent = useCallback(async (
        eventName: string,
        metadata?: Record<string, unknown>
    ) => {
        try {
            // Get org context from supabase session (no await blocking)
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fire-and-forget via fetch
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: eventName, data: metadata }),
            }).catch(() => {
                // Silently ignore network errors — telemetry should never break UI
            })
        } catch {
            // Never throw from analytics
        }
    }, [])

    return { trackEvent }
}
