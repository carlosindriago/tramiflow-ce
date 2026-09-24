import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSelect = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: mockSelect,
        })),
    })),
}))

import { GET } from './route'

function makeRequest(authHeader?: string) {
    const headers = new Headers()
    if (authHeader !== undefined) headers.set('authorization', authHeader)
    return new Request('http://localhost/api/cron/check-expirations', { headers })
}

describe('GET /api/cron/check-expirations', () => {
    const originalEnv = {
        CRON_SECRET: process.env.CRON_SECRET,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockSelect.mockReturnValue({
            gte: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            neq: vi.fn().mockResolvedValue({ data: [], error: null }),
        })
    })

    afterEach(() => {
        for (const [key, value] of Object.entries(originalEnv)) {
            if (value === undefined) delete process.env[key]
            else process.env[key] = value
        }
    })

    it('rejects the request when CRON_SECRET is not configured, instead of running unauthenticated', async () => {
        delete process.env.CRON_SECRET

        const response = await GET(makeRequest('Bearer anything'))

        expect(response.status).toBe(401)
    })

    it('rejects requests with a missing or wrong secret when CRON_SECRET is configured', async () => {
        process.env.CRON_SECRET = 'super-secret'

        const response = await GET(makeRequest('Bearer wrong-secret'))

        expect(response.status).toBe(401)
    })

    it('allows the request through when the bearer token matches CRON_SECRET', async () => {
        process.env.CRON_SECRET = 'super-secret'
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

        const response = await GET(makeRequest('Bearer super-secret'))

        expect(response.status).toBe(200)
    })
})
