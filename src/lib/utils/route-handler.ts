import { type NextRequest } from "next/server";
import type { ZodSchema } from "zod";
import { auth } from "@/lib/auth/config";
import { withRateLimit, type RateLimitKey } from "@/lib/middleware/ratelimit.middleware";
import { logActivity } from "@/lib/middleware/audit.middleware";
import { ApiResponse, ErrorCodes } from "@/lib/utils/api-response";
import { isAppError } from "@/lib/utils/errors";
import type { Session } from "next-auth";

interface RouteConfig {
  /** Roles allowed to access this route. Use ["PUBLIC"] to skip auth entirely. */
  roles: string[];
  rateLimit?: RateLimitKey;
  bodySchema?: ZodSchema;
  querySchema?: ZodSchema;
  /** Action name for the activity audit log (e.g. "CREATE_COMPANY"). */
  action?: string;
}

type HandlerContext = {
  session: Session | null;
  body?: unknown;
  query?: unknown;
};

export function createRoute(
  config: RouteConfig,
  handler: (req: NextRequest, ctx: HandlerContext) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const isPublic = config.roles.includes("PUBLIC");

      // 1. Auth + RBAC
      let session: Session | null = null;

      if (!isPublic) {
        session = await auth();

        if (!session) {
          return Response.json(
            ApiResponse.error(ErrorCodes.UNAUTHORIZED, "Unauthorized — please sign in"),
            { status: 401 }
          );
        }

        if (!config.roles.includes(session.user.role as string)) {
          return Response.json(
            ApiResponse.error(ErrorCodes.FORBIDDEN, "You do not have permission to perform this action"),
            { status: 403 }
          );
        }
      }

      // 2. Rate limiting
      if (config.rateLimit) {
        const identifier = session?.user.id ?? req.ip ?? req.headers.get("x-forwarded-for") ?? "anonymous";
        const limited = await withRateLimit(req, config.rateLimit, identifier);
        if (limited) return limited;
      }

      // 3. Body validation
      let body: unknown;
      if (config.bodySchema && req.method !== "GET") {
        const raw = await req.json().catch(() => ({}));
        const result = config.bodySchema.safeParse(raw);
        if (!result.success) {
          return Response.json(
            ApiResponse.error(ErrorCodes.VALIDATION_ERROR, "Invalid request body", result.error.flatten()),
            { status: 400 }
          );
        }
        body = result.data;
      }

      // 4. Query validation
      let query: unknown;
      if (config.querySchema) {
        const params = Object.fromEntries(req.nextUrl.searchParams);
        const result = config.querySchema.safeParse(params);
        if (!result.success) {
          return Response.json(
            ApiResponse.error(ErrorCodes.VALIDATION_ERROR, "Invalid query parameters", result.error.flatten()),
            { status: 400 }
          );
        }
        query = result.data;
      }

      // 5. Execute handler
      const response = await handler(req, { session, body, query });

      // 6. Non-blocking audit log for mutating actions
      if (config.action && session?.user.id) {
        logActivity(
          session.user.id,
          config.action,
          config.action.split("_").slice(1).join("_"),
          undefined,
          undefined,
          req.ip ?? undefined
        ).catch(() => {});
      }

      return response;
    } catch (err) {
      if (isAppError(err)) {
        return Response.json(
          ApiResponse.error(err.code, err.message),
          { status: err.statusCode }
        );
      }
      console.error("[API Error]", err);
      return Response.json(
        ApiResponse.error(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 }
      );
    }
  };
}
