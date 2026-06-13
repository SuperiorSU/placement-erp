import { type NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { createRoute } from "@/lib/utils/route-handler";
import { LoginSchema } from "@/lib/validations/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { ApiResponse } from "@/lib/utils/api-response";
import { logActivity } from "@/lib/middleware/audit.middleware";

const COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export const POST = createRoute(
  { roles: ["PUBLIC"], rateLimit: "auth", bodySchema: LoginSchema },
  async (req: NextRequest, { body }) => {
    const { email, password } = body as { email: string; password: string };

    const user = await AuthService.validateCredentials(email, password);

    // Build and sign the NextAuth-compatible JWT
    const token = await encode({
      token: {
        sub:   user.id,
        email: user.email,
        role:  user.role,
        id:    user.id,
        iat:   Math.floor(Date.now() / 1000),
      },
      secret:  process.env.NEXTAUTH_SECRET!,
      salt:    COOKIE_NAME,
      maxAge:  8 * 60 * 60,
    });

    // Log the login action
    logActivity(
      user.id,
      "LOGIN",
      "User",
      user.id,
      undefined,
      req.ip ?? req.headers.get("x-forwarded-for") ?? undefined
    ).catch(() => {});

    const response = NextResponse.json(
      ApiResponse.success({
        user: { id: user.id, email: user.email, role: user.role },
        message: "Login successful",
      })
    );

    response.cookies.set({
      name:     COOKIE_NAME,
      value:    token,
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   8 * 60 * 60,
      path:     "/",
    });

    return response;
  }
);
