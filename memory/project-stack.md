---
name: project-stack
description: Stack versions and breaking changes discovered during Module 1 setup
metadata:
  type: project
---

**Stack:** Next.js 16.2.6 · NextAuth 5.0.0-beta.31 · Prisma 7.8.0 · React 19 · TypeScript 5 · Tailwind 4

**Why:** Breaking changes vs GUIDE.md assumptions (written for older versions):

- **Prisma v7**: `url` removed from `schema.prisma` datasource. Must use `prisma.config.ts` with `defineConfig({ datasource: { url } })`. PrismaClient requires a driver adapter: `@prisma/adapter-pg` + `pg`.
- **Next.js 16**: Route handler API unchanged (same `NextRequest`, `Response.json`). App Router conventions unchanged.
- **NextAuth v5 beta.31**: Cookie name is `authjs.session-token` (dev) / `__Secure-authjs.session-token` (prod). The `encode`/`decode` JWT functions are from `@auth/core/jwt` via `next-auth/jwt`. The `salt` param must equal the cookie name.

**How to apply:** Always check for breaking changes before using patterns from GUIDE.md. Prisma adapter must be included in `prisma.ts`. Cookie name must match salt in `encode()` call.
