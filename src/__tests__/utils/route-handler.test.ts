import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock all external dependencies before importing createRoute
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/middleware/ratelimit.middleware", () => ({
  withRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/middleware/audit.middleware", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

import { createRoute } from "@/lib/utils/route-handler";
import { auth } from "@/lib/auth/config";
import { withRateLimit } from "@/lib/middleware/ratelimit.middleware";

const mockAuth = vi.mocked(auth);
const mockRateLimit = vi.mocked(withRateLimit);

function makeRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  query?: Record<string, string>;
} = {}) {
  const url = new URL(options.url ?? "http://localhost/api/test");
  Object.entries(options.query ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));

  return {
    method: options.method ?? "GET",
    url: url.toString(),
    nextUrl: url,
    ip: "127.0.0.1",
    headers: { get: (_k: string) => null } as unknown as Headers,
    json: () => Promise.resolve(options.body ?? {}),
  } as never;
}

function makeSession(role = "ADMIN") {
  return { user: { id: "user-1", email: "admin@test.com", role } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockResolvedValue(null);
});

describe("createRoute — auth", () => {
  it("returns 401 when no session and route is not PUBLIC", async () => {
    mockAuth.mockResolvedValue(null as never);
    const handler = createRoute(
      { roles: ["ADMIN"] },
      async () => Response.json({ ok: true })
    );
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("AUTH_001");
  });

  it("returns 403 when session role does not match allowed roles", async () => {
    mockAuth.mockResolvedValue(makeSession("STUDENT") as never);
    const handler = createRoute(
      { roles: ["ADMIN"] },
      async () => Response.json({ ok: true })
    );
    const res = await handler(makeRequest());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("AUTH_002");
  });

  it("calls handler when session role matches", async () => {
    mockAuth.mockResolvedValue(makeSession("ADMIN") as never);
    const innerHandler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const handler = createRoute({ roles: ["ADMIN"] }, innerHandler);
    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(innerHandler).toHaveBeenCalledOnce();
  });

  it("skips auth for PUBLIC routes", async () => {
    const innerHandler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const handler = createRoute({ roles: ["PUBLIC"] }, innerHandler);
    await handler(makeRequest());
    expect(mockAuth).not.toHaveBeenCalled();
    expect(innerHandler).toHaveBeenCalledOnce();
  });

  it("allows SUPER_ADMIN when role is in the allowed list", async () => {
    mockAuth.mockResolvedValue(makeSession("SUPER_ADMIN") as never);
    const innerHandler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const handler = createRoute({ roles: ["ADMIN", "SUPER_ADMIN"] }, innerHandler);
    await handler(makeRequest());
    expect(innerHandler).toHaveBeenCalledOnce();
  });
});

describe("createRoute — body validation", () => {
  it("returns 400 for invalid body", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    const schema = z.object({ name: z.string().min(1) });
    const handler = createRoute(
      { roles: ["ADMIN"], bodySchema: schema },
      async () => Response.json({ ok: true })
    );
    const res = await handler(makeRequest({ method: "POST", body: { name: "" } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VAL_001");
  });

  it("passes validated body to handler", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    const schema = z.object({ name: z.string().min(1) });
    const innerHandler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const handler = createRoute(
      { roles: ["ADMIN"], bodySchema: schema },
      innerHandler
    );
    await handler(makeRequest({ method: "POST", body: { name: "Acme" } }));
    expect(innerHandler.mock.calls[0][1].body).toEqual({ name: "Acme" });
  });

  it("skips body parsing for GET requests even when bodySchema is set", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    const schema = z.object({ name: z.string() });
    const innerHandler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const handler = createRoute(
      { roles: ["ADMIN"], bodySchema: schema },
      innerHandler
    );
    await handler(makeRequest({ method: "GET" }));
    expect(innerHandler.mock.calls[0][1].body).toBeUndefined();
  });
});

describe("createRoute — query validation", () => {
  it("returns 400 for invalid query params", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    const schema = z.object({ page: z.coerce.number().min(1) });
    const handler = createRoute(
      { roles: ["ADMIN"], querySchema: schema },
      async () => Response.json({ ok: true })
    );
    const res = await handler(makeRequest({ query: { page: "0" } }));
    expect(res.status).toBe(400);
  });

  it("passes validated query to handler", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    const schema = z.object({ page: z.coerce.number().default(1) });
    const innerHandler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const handler = createRoute(
      { roles: ["ADMIN"], querySchema: schema },
      innerHandler
    );
    await handler(makeRequest({ query: { page: "3" } }));
    expect(innerHandler.mock.calls[0][1].query).toEqual({ page: 3 });
  });
});

describe("createRoute — error handling", () => {
  it("returns 500 for unexpected errors", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    const handler = createRoute(
      { roles: ["ADMIN"] },
      async () => { throw new Error("database offline"); }
    );
    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("SRV_001");
  });

  it("returns AppError status for known errors", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    const { NotFoundError } = await import("@/lib/utils/errors");
    const handler = createRoute(
      { roles: ["ADMIN"] },
      async () => { throw new NotFoundError("Company not found"); }
    );
    const res = await handler(makeRequest());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.message).toBe("Company not found");
  });
});

describe("createRoute — rate limiting", () => {
  it("returns rate limit response when limiter fires", async () => {
    mockAuth.mockResolvedValue(makeSession() as never);
    const rateLimitResponse = Response.json({ error: { code: "RATE_001" } }, { status: 429 });
    mockRateLimit.mockResolvedValue(rateLimitResponse as never);
    const innerHandler = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const handler = createRoute({ roles: ["ADMIN"], rateLimit: "api" }, innerHandler);
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
    expect(innerHandler).not.toHaveBeenCalled();
  });
});
