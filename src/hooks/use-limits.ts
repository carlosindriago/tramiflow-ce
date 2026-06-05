'use client'

import { useEffect, useState } from 'react'
import { getOrganizationLimits, type LimitsState } from '@/app/(dashboard)/actions'

export function useLimits() {
    const [limits, setLimits] = useState<LimitsState | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLimits = async () => {
        try {
            const res = await getOrganizationLimits()
            if (res.success && res.data) {
                setLimits(res.data)
            } else {
                setError(res.error || 'Error fetching limits')
            }
        } catch (err) {
            setError('Failed to load limits')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLimits()
    }, [])

    return { limits, loading, error, refresh: fetchLimits }
}
