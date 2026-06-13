import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/super-admin":          ["SUPER_ADMIN"],
  "/admin":                ["ADMIN"],
  "/student":              ["STUDENT"],
  "/api/v1/super-admin":   ["SUPER_ADMIN"],
  "/api/v1/admin":         ["ADMIN"],
  "/api/v1/student":       ["STUDENT"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session       = req.auth;

  for (const [prefix, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(prefix)) {
      if (!session) {
        // API routes return 401 JSON; page routes redirect to login
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { success: false, error: { code: "AUTH_001", message: "Unauthorized" } },
            { status: 401 }
          );
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }

      if (!allowedRoles.includes(session.user.role)) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { success: false, error: { code: "AUTH_002", message: "Forbidden" } },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)"],
};
