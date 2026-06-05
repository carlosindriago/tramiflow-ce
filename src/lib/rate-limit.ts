import { Redis } from '@upstash/redis'

/**
 * Rate Limiting - Redis + In-Memory Fallback Implementation
 *
 * Uses Upstash Redis for distributed rate limiting in Serverless/Vercel environments.
 * Falls back to an in-memory Map if Redis credentials are not provided (useful for local dev).
 *
 * Usage:
 *   const { success, remaining } = await rateLimit('user_123', 5, 60)
 *   if (!success) {
 *     return { error: 'Too many requests. Try again later.' }
 *   }
 */

interface RateLimitRecord {
    count: number
    resetTime: number // Timestamp in milliseconds
}

// 1. Initialize Redis Client (if environment variables exist)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null

// 2. In-memory fallback setup
const rateLimitMap = new Map<string, RateLimitRecord>()
const CLEANUP_INTERVAL = 5 * 60 * 1000

if (typeof window === 'undefined' && !redis) {
    // Server-side cleanup for in-memory map
    setInterval(() => {
        const now = Date.now()
        for (const [key, record] of rateLimitMap.entries()) {
            if (now > record.resetTime) {
                rateLimitMap.delete(key)
            }
        }
    }, CLEANUP_INTERVAL)
}

/**
 * Rate limit checker
 *
 * @param identifier - Unique identifier (IP, userId, sessionId, etc.)
 * @param limit - Maximum requests allowed within window
 * @param window - Time window in seconds
 * @returns Result with success status and remaining requests
 */
export async function rateLimit(
    identifier: string,
    limit: number = 5,
    window: number = 60
): Promise<{ success: boolean; remaining: number; resetTime?: number }> {
    const key = `rate-limit:${identifier}`
    const now = Date.now()

    // 3A. Redis Implementation (Production/Vercel)
    if (redis) {
        try {
            // Use Redis pipeline for atomicity.
            // INCR creates the key with value 1 if it doesn't exist, and returns the new value.
            const pipeline = redis.pipeline()
            pipeline.incr(key)
            pipeline.pttl(key) // get remaining time to live in ms
            const [count, pttl] = await pipeline.exec() as [number, number]

            // If it's a new key, pttl will be -1 (no expire)
            let finalPttl = pttl
            if (pttl === -1 || pttl === -2) {
                await redis.expire(key, window)
                finalPttl = window * 1000
            }

            const resetTime = now + finalPttl

            if (count > limit) {
                return { success: false, remaining: 0, resetTime }
            }

            return { success: true, remaining: limit - count, resetTime }
        } catch (error) {
            console.error('Redis Rate Limit Error, falling back to memory:', error)
            // Fall through to memory if Redis fails
        }
    }

    // 3B. In-Memory Implementation (Local Dev / Fallback)
    const record = rateLimitMap.get(key)

    // No existing record or expired → create new
    if (!record || now > record.resetTime) {
        const resetTime = now + (window * 1000)
        rateLimitMap.set(key, { count: 1, resetTime })

        return {
            success: true,
            remaining: limit - 1,
            resetTime,
        }
    }

    // Existing record within window
    if (record.count >= limit) {
        // Rate limit exceeded
        return {
            success: false,
            remaining: 0,
            resetTime: record.resetTime,
        }
    }

    // Increment count
    record.count++
    return {
        success: true,
        remaining: limit - record.count,
        resetTime: record.resetTime,
    }
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
    VIEW_TRACKING: { limit: 10, window: 60 }, // 10 views per minute per template
    LEAD_SUBMISSION: { limit: 5, window: 60 }, // 5 leads per minute per template
    AUTH_ATTEMPTS: { limit: 5, window: 300 }, // 5 auth attempts per 5 minutes per IP
    API_REQUESTS: { limit: 100, window: 60 }, // 100 API requests per minute per user
} as const
