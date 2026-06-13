import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email    = (credentials?.email as string | undefined)?.toLowerCase().trim();
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, password: true, role: true, isActive: true },
        });

        // Always run bcrypt.compare to prevent timing attacks that reveal email existence
        const dummyHash = "$2b$12$dummyhashvaluepreventstimingattacksxxxxxxxxxxxxxxxxxxxxxx";
        const valid     = await bcrypt.compare(password, user?.password ?? dummyHash);

        if (!user || !valid || !user.isActive) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id   = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.role = token.role as string;
        session.user.id   = token.id   as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages:   { signIn: "/login" },
  secret:  process.env.NEXTAUTH_SECRET,
});
