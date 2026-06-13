import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { RegisterSchema } from "@/lib/validations/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { ApiResponse, ErrorCodes } from "@/lib/utils/api-response";

/**
 * Dev/test-only registration endpoint.
 * Blocked in production to prevent unauthorised account creation.
 *
 * SUPER_ADMIN creation: no auth required (bootstrapping).
 * ADMIN creation: requires an existing SUPER_ADMIN session.
 * STUDENT creation: requires an existing ADMIN or SUPER_ADMIN session.
 */
export const POST = createRoute(
  { roles: ["PUBLIC"], bodySchema: RegisterSchema },
  async (_req: NextRequest, { body, session }) => {
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        ApiResponse.error(ErrorCodes.FORBIDDEN, "Registration endpoint is disabled in production"),
        { status: 403 }
      );
    }

    const data = body as import("@/lib/validations/auth.schema").RegisterInput;

    // Role-based guard: creating ADMINs or STUDENTs requires a session
    if (data.role !== "SUPER_ADMIN" && !session) {
      return Response.json(
        ApiResponse.error(ErrorCodes.UNAUTHORIZED, "You must be logged in to create this role"),
        { status: 401 }
      );
    }

    if (data.role === "ADMIN" && session?.user.role !== "SUPER_ADMIN") {
      return Response.json(
        ApiResponse.error(ErrorCodes.FORBIDDEN, "Only SUPER_ADMIN can create ADMIN accounts"),
        { status: 403 }
      );
    }

    if (data.role === "STUDENT" && !["ADMIN", "SUPER_ADMIN"].includes(session?.user.role ?? "")) {
      return Response.json(
        ApiResponse.error(ErrorCodes.FORBIDDEN, "Only ADMIN or SUPER_ADMIN can create STUDENT accounts"),
        { status: 403 }
      );
    }

    const user = await AuthService.register(data, session?.user.id);

    return Response.json(
      ApiResponse.success({ user, message: `${data.role} account created successfully` }),
      { status: 201 }
    );
  }
);
