import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

export const rateLimiters = {
  trackEvento: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "60 s"),
        prefix: "track",
      })
    : null,

  upload: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "60 s"),
        prefix: "upload",
      })
    : null,

  passwordReset: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(3, "15 m"),
        prefix: "password_reset",
      })
    : null,
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<RateLimitResult> {
  if (!limiter) {
    // Graceful fallback when Redis is unavailable
    return { success: true, limit: Infinity, remaining: Infinity, reset: 0 };
  }
  const result = await limiter.limit(key);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "COLABORADORA";
}
