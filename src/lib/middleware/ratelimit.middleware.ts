import { type NextRequest } from "next/server";
import { ApiResponse, ErrorCodes } from "@/lib/utils/api-response";

export type RateLimitKey = "auth" | "api" | "upload";

// Lazily initialised — only created when Upstash env vars are present
let rateLimiters: Record<RateLimitKey, import("@upstash/ratelimit").Ratelimit> | null = null;

function getRateLimiters() {
  if (rateLimiters) return rateLimiters;

  const url   = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  // Graceful no-op when Redis is not configured (e.g. local dev without Redis)
  if (!url || !token) return null;

  const { Ratelimit } = require("@upstash/ratelimit");
  const { Redis }     = require("@upstash/redis");

  const redis = new Redis({ url, token });

  rateLimiters = {
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:auth",
    }),
    api: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      prefix: "rl:api",
    }),
    upload: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "rl:upload",
    }),
  };

  return rateLimiters;
}

export async function withRateLimit(
  _req: NextRequest,
  limiterKey: RateLimitKey,
  identifier: string
): Promise<Response | null> {
  const limiters = getRateLimiters();

  // Skip rate limiting if Redis is not configured
  if (!limiters) return null;

  const { success } = await limiters[limiterKey].limit(identifier);

  if (!success) {
    return Response.json(
      ApiResponse.error(ErrorCodes.RATE_LIMITED, "Too many requests — please try again later"),
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  return null;
}
