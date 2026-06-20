import { type NextRequest } from "next/server";
import { ApiResponse, ErrorCodes } from "@/lib/utils/api-response";

export type RateLimitKey = "auth" | "api" | "upload";

// Limits per window
const LIMITS: Record<RateLimitKey, { max: number; windowSecs: number }> = {
  auth:   { max: 5,   windowSecs: 900 }, // 5 / 15 min
  api:    { max: 100, windowSecs: 60  }, // 100 / 1 min
  upload: { max: 10,  windowSecs: 60  }, // 10 / 1 min
};

// ── Redis singleton ────────────────────────────────────────────────────────────

let redis: import("ioredis").Redis | null = null;

function getRedis(): import("ioredis").Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  const { Redis } = require("ioredis") as typeof import("ioredis");

  redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout:       3000,
    lazyConnect:          true,
    enableOfflineQueue:   false,
  });

  redis.on("error", () => {
    // Swallow connection errors so the app stays up without Redis
    redis = null;
  });

  return redis;
}

// ── Fixed-window counter via INCR + EXPIRE ────────────────────────────────────

async function check(
  client: import("ioredis").Redis,
  key:    string,
  max:    number,
  window: number
): Promise<boolean> {
  const count = await client.incr(key);
  if (count === 1) await client.expire(key, window);
  return count <= max;
}

// ── Public interface ───────────────────────────────────────────────────────────

export async function withRateLimit(
  _req:       NextRequest,
  limiterKey: RateLimitKey,
  identifier: string
): Promise<Response | null> {
  const client = getRedis();
  if (!client) return null; // Graceful no-op when Redis is not configured

  try {
    const { max, windowSecs } = LIMITS[limiterKey];
    const key = `rl:${limiterKey}:${identifier}`;
    const allowed = await check(client, key, max, windowSecs);

    if (!allowed) {
      return Response.json(
        ApiResponse.error(ErrorCodes.RATE_LIMITED, "Too many requests — please try again later"),
        { status: 429, headers: { "Retry-After": String(windowSecs) } }
      );
    }
  } catch {
    // If Redis is unreachable, fail open (let the request through)
    return null;
  }

  return null;
}
