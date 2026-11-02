import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory sliding window limiter fallback
interface RateLimitBucket {
  timestamps: number[];
}

class MemoryRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();

  public check(key: string, limit: number, windowMs: number): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { timestamps: [] };
      this.buckets.set(key, bucket);
    }

    // Filter out expired timestamps
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);

    if (bucket.timestamps.length >= limit) {
      const oldest = bucket.timestamps[0] || now;
      const reset = oldest + windowMs;
      return { success: false, remaining: 0, reset };
    }

    bucket.timestamps.push(now);
    const remaining = limit - bucket.timestamps.length;
    return { success: true, remaining, reset: now + windowMs };
  }

  // Periodic cleanup to avoid memory leak
  public cleanup(maxAgeMs = 300000) {
    const threshold = Date.now() - maxAgeMs;
    for (const [key, bucket] of this.buckets.entries()) {
      bucket.timestamps = bucket.timestamps.filter((ts) => ts > threshold);
      if (bucket.timestamps.length === 0) {
        this.buckets.delete(key);
      }
    }
  }
}

const globalMemoryLimiter = new MemoryRateLimiter();

// Run periodic cleanup every 2 minutes
if (typeof setInterval !== 'undefined') {
  // Do not keep one-off workers or the Node test runner alive solely for
  // limiter housekeeping. Long-running application processes still retain it.
  const cleanupTimer = setInterval(() => globalMemoryLimiter.cleanup(), 120000);
  (cleanupTimer as ReturnType<typeof setInterval> & { unref?: () => void }).unref?.();
}

// Check if Upstash is configured
const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let redis: Redis | null = null;
if (hasUpstash) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  } catch (err) {
    console.warn('[RateLimit] Failed to initialize Upstash Redis, using in-memory limiter.', err);
    redis = null;
  }
}

export type RateLimitTier = 'auth' | 'register' | 'payment' | 'ticket_recovery' | 'admin' | 'api' | 'default';

const TIER_CONFIGS: Record<RateLimitTier, { requests: number; windowMs: number }> = {
  auth: {
    requests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '10', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '60000', 10),
  },
  register: {
    requests: 5,
    windowMs: 60000,
  },
  payment: {
    requests: 10,
    windowMs: 60000,
  },
  ticket_recovery: {
    requests: 5,
    windowMs: 60000,
  },
  admin: {
    requests: 30,
    windowMs: 60000,
  },
  api: {
    requests: parseInt(process.env.RATE_LIMIT_API_MAX_REQUESTS || '30', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || '60000', 10),
  },
  default: {
    requests: parseInt(process.env.RATE_LIMIT_DEFAULT_MAX_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_DEFAULT_WINDOW_MS || '60000', 10),
  },
};

/**
 * High-risk production operations require Redis. Memory is intentionally a
 * development-only convenience; it cannot protect a horizontally scaled app.
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = 'default'
): Promise<{ success: boolean; remaining: number; reset: number; source: 'upstash' | 'memory' | 'unavailable' }> {
  const config = TIER_CONFIGS[tier] || TIER_CONFIGS.default;
  const key = `msc_rl:${tier}:${identifier}`;

  if (redis) {
    try {
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.requests, `${config.windowMs} ms`),
        analytics: false,
        prefix: 'msc_rl',
      });

      const result = await ratelimit.limit(`${tier}:${identifier}`);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
        source: 'upstash',
      };
    } catch (err) {
      console.error('[RateLimit] Upstash execution error.', err);
    }
  }

  const production = process.env.NODE_ENV === 'production';
  const distributedRequired = tier !== 'default';
  if (production && distributedRequired) {
    // Deliberate fail-closed behaviour: do not accept brute-force, payment,
    // registration, recovery, or admin traffic without distributed protection.
    return { success: false, remaining: 0, reset: Date.now() + config.windowMs, source: 'unavailable' };
  }

  // Local development/test fallback only.
  const memResult = globalMemoryLimiter.check(key, config.requests, config.windowMs);
  return {
    ...memResult,
    source: 'memory',
  };
}

/**
 * Extract an address only from a verified platform header. Never accept an
 * arbitrary X-Forwarded-For or X-Real-IP supplied by a direct client.
 * Configure TRUSTED_PROXY_MODE=vercel or cloudflare in production; otherwise
 * callers share the conservative "unknown" bucket.
 */
export function getClientIP(headers: Headers): string {
  const proxy = process.env.TRUSTED_PROXY_MODE;
  if (proxy === 'vercel') {
    const value = headers.get('x-vercel-forwarded-for');
    if (value) return value.split(',')[0].trim();
  }
  if (proxy === 'cloudflare') {
    const value = headers.get('cf-connecting-ip');
    if (value) return value.trim();
  }
  return process.env.NODE_ENV === 'production' ? 'unknown' : '127.0.0.1';
}
