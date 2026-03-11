/**
 * Simple in-memory per-user rate limiter.
 * Resets on server restart / redeploy — good enough for Phase 1.
 */

interface RateLimitEntry {
  timestamps: number[]
}

interface RateLimitConfig {
  /** Max requests in the window */
  limit: number
  /** Window size in milliseconds */
  windowMs: number
}

const store = new Map<string, RateLimitEntry>()

// Periodically clean up old entries to avoid memory leaks (every 5 min)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      // Remove entries with no timestamps in the last hour
      entry.timestamps = entry.timestamps.filter((t) => now - t < 3_600_000)
      if (entry.timestamps.length === 0) store.delete(key)
    }
  }, 300_000)
}

export function checkRateLimit(
  userId: string,
  bucket: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfterMs: number } {
  const key = `${bucket}:${userId}`
  const now = Date.now()

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs)

  if (entry.timestamps.length >= config.limit) {
    const oldest = entry.timestamps[0]
    const retryAfterMs = oldest + config.windowMs - now
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) }
  }

  entry.timestamps.push(now)
  return { allowed: true, retryAfterMs: 0 }
}

// Pre-defined rate limit configs per route category
export const RATE_LIMITS = {
  ai: { limit: 10, windowMs: 60_000 },        // 10/min
  aiHourly: { limit: 100, windowMs: 3_600_000 }, // 100/hour
  import: { limit: 5, windowMs: 60_000 },       // 5/min
  imageSearch: { limit: 10, windowMs: 60_000 },  // 10/min
  export: { limit: 3, windowMs: 60_000 },        // 3/min
} as const

/**
 * Helper that checks both per-minute and per-hour limits for AI routes.
 * Returns a 429 Response if rate limited, or null if allowed.
 */
export function checkAiRateLimit(userId: string): Response | null {
  const perMin = checkRateLimit(userId, "ai", RATE_LIMITS.ai)
  if (!perMin.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait before making another AI request." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(perMin.retryAfterMs / 1000)) },
      }
    )
  }

  const perHour = checkRateLimit(userId, "ai-hour", RATE_LIMITS.aiHourly)
  if (!perHour.allowed) {
    return Response.json(
      { error: "Hourly AI request limit reached. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(perHour.retryAfterMs / 1000)) },
      }
    )
  }

  return null
}

/**
 * Helper for non-AI route rate limiting.
 * Returns a 429 Response if rate limited, or null if allowed.
 */
export function checkRouteRateLimit(
  userId: string,
  bucket: string,
  config: RateLimitConfig
): Response | null {
  const result = checkRateLimit(userId, bucket, config)
  if (!result.allowed) {
    return Response.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) },
      }
    )
  }
  return null
}
