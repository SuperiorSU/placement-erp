import { createClient } from "redis";
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

type RedisClient = ReturnType<typeof createClient>;

let redis: RedisClient | null = null;

async function getRedis(): Promise<RedisClient | null> {
  const host = process.env.REDIS_HOST;
  if (!host) return null;

  if (redis?.isOpen) return redis;

  redis = createClient({
    username: process.env.REDIS_USERNAME ?? "default",
    password: process.env.REDIS_PASSWORD,
    socket: {
      host,
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });

  redis.on("error", () => {
    redis = null;
  });

  try {
    await redis.connect();
  } catch {
    redis = null;
    return null;
  }

  return redis;
}

// ── Fixed-window counter via INCR + EXPIRE ────────────────────────────────────

async function check(
  client: RedisClient,
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
  const client = await getRedis();
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
