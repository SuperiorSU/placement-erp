import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { logActivity } from "@/lib/middleware/audit.middleware";
import { AuthError, ConflictError, ValidationError } from "@/lib/utils/errors";
import type { RegisterInput } from "@/lib/validations/auth.schema";

const BCRYPT_ROUNDS = 12;

export type SafeUser = {
  id:    string;
  email: string;
  role:  string;
};

export const AuthService = {
  /**
   * Validate credentials and return safe user data.
   * Never reveals whether the email exists — same error for both bad email and bad password.
   */
  async validateCredentials(email: string, password: string): Promise<SafeUser> {
    const normalised = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalised },
      select: { id: true, email: true, password: true, role: true, isActive: true },
    });

    // Always run bcrypt.compare to prevent timing attacks
    const dummy = "$2b$12$dummyhashvaluepreventstimingattacksxxxxxxxxxxxxxxxxxxxxxx";
    const valid = await bcrypt.compare(password, user?.password ?? dummy);

    if (!user || !valid) {
      throw new AuthError("Invalid credentials");
    }

    if (!user.isActive) {
      throw new AuthError("Account is deactivated — contact your administrator");
    }

    // Non-blocking update of lastLoginAt
    prisma.user
      .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {});

    return { id: user.id, email: user.email, role: user.role };
  },

  /**
   * Register a new user (dev/testing only — guarded in the route).
   */
  async register(data: RegisterInput, actorId?: string): Promise<SafeUser> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError("Email already in use");

    if (data.role === "STUDENT") {
      if (!data.rollNumber) throw new ValidationError("rollNumber is required for STUDENT role");
      if (!data.branch)     throw new ValidationError("branch is required for STUDENT role");
      if (data.cgpa === undefined) throw new ValidationError("cgpa is required for STUDENT role");
      if (!data.graduationYear)    throw new ValidationError("graduationYear is required for STUDENT role");

      const rollExists = await prisma.student.findUnique({ where: { rollNumber: data.rollNumber } });
      if (rollExists) throw new ConflictError("Roll number already in use");
    }

    const hashed = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email: data.email, password: hashed, role: data.role as never },
      });

      if (data.role === "ADMIN" || data.role === "SUPER_ADMIN") {
        await tx.admin.create({
          data: {
            userId:     newUser.id,
            name:       data.name,
            phone:      data.phone,
            department: data.department,
            createdBy:  actorId ?? newUser.id,
          },
        });
      } else if (data.role === "STUDENT") {
        await tx.student.create({
          data: {
            userId:         newUser.id,
            name:           data.name,
            rollNumber:     data.rollNumber!,
            branch:         data.branch!,
            cgpa:           data.cgpa!,
            graduationYear: data.graduationYear!,
            phone:          data.phone,
          },
        });
      }

      return newUser;
    });

    if (actorId) {
      logActivity(actorId, "CREATE_USER", "User", user.id, { role: data.role }).catch(() => {});
    }

    return { id: user.id, email: user.email, role: user.role };
  },

  async hashPassword(plain: string): Promise<string> {
    if (plain.length < 8)   throw new ValidationError("Password must be at least 8 characters");
    if (plain.length > 128) throw new ValidationError("Password too long");
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  },
};
