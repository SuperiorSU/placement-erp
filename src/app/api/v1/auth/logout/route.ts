import { NextResponse } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { logActivity } from "@/lib/middleware/audit.middleware";

const COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export const POST = createRoute(
  { roles: ["STUDENT", "ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
  async (_req, { session }) => {
    if (session?.user.id) {
      logActivity(session.user.id, "LOGOUT", "User", session.user.id).catch(() => {});
    }

    const response = NextResponse.json(
      ApiResponse.success({ message: "Logged out successfully" })
    );

    // Clear the session cookie
    response.cookies.set({
      name:    COOKIE_NAME,
      value:   "",
      maxAge:  0,
      path:    "/",
    });

    return response;
  }
);
