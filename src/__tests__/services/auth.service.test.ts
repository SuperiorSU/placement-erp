import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    admin: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash:    vi.fn(),
  },
  compare: vi.fn(),
  hash:    vi.fn(),
}));

vi.mock("@/lib/middleware/audit.middleware", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

import { AuthService } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

const mockPrisma    = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  student: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  admin: { create: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};
const mockBcrypt    = bcrypt as unknown as { compare: ReturnType<typeof vi.fn>; hash: ReturnType<typeof vi.fn> };

beforeEach(() => { vi.clearAllMocks(); });

describe("AuthService.validateCredentials", () => {
  const activeUser = {
    id:       "user-1",
    email:    "admin@erp.local",
    password: "$hashed",
    role:     "ADMIN",
    isActive: true,
  };

  it("returns safe user on valid credentials", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(activeUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.user.update.mockResolvedValue({});

    const result = await AuthService.validateCredentials("admin@erp.local", "Admin@123");
    expect(result).toEqual({ id: "user-1", email: "admin@erp.local", role: "ADMIN" });
  });

  it("normalises email to lowercase before lookup", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(activeUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.user.update.mockResolvedValue({});

    await AuthService.validateCredentials("ADMIN@ERP.LOCAL", "Admin@123");
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "admin@erp.local" } })
    );
  });

  it("throws AuthError when user not found (timing-safe: bcrypt still runs)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcrypt.compare.mockResolvedValue(false);

    const { AuthError } = await import("@/lib/utils/errors");
    await expect(AuthService.validateCredentials("x@x.com", "pass")).rejects.toThrow(AuthError);
    // bcrypt.compare must always run even when user is null (timing-attack prevention)
    expect(mockBcrypt.compare).toHaveBeenCalledOnce();
  });

  it("throws AuthError when password is wrong", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(activeUser);
    mockBcrypt.compare.mockResolvedValue(false);

    const { AuthError } = await import("@/lib/utils/errors");
    await expect(AuthService.validateCredentials("admin@erp.local", "wrong")).rejects.toThrow(AuthError);
  });

  it("throws AuthError when account is deactivated", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...activeUser, isActive: false });
    mockBcrypt.compare.mockResolvedValue(true);

    const { AuthError } = await import("@/lib/utils/errors");
    await expect(AuthService.validateCredentials("admin@erp.local", "Admin@123")).rejects.toThrow(AuthError);
  });
});

describe("AuthService.hashPassword", () => {
  it("throws ValidationError for password shorter than 8 chars", async () => {
    const { ValidationError } = await import("@/lib/utils/errors");
    await expect(AuthService.hashPassword("short")).rejects.toThrow(ValidationError);
    expect(mockBcrypt.hash).not.toHaveBeenCalled();
  });

  it("throws ValidationError for password longer than 128 chars", async () => {
    const { ValidationError } = await import("@/lib/utils/errors");
    const longPass = "a".repeat(129);
    await expect(AuthService.hashPassword(longPass)).rejects.toThrow(ValidationError);
  });

  it("calls bcrypt.hash for valid password", async () => {
    mockBcrypt.hash.mockResolvedValue("$hashed");
    const result = await AuthService.hashPassword("ValidPass@1");
    expect(mockBcrypt.hash).toHaveBeenCalledWith("ValidPass@1", 12);
    expect(result).toBe("$hashed");
  });
});

describe("AuthService.register", () => {
  it("throws ConflictError when email is already taken", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "existing" });

    const { ConflictError } = await import("@/lib/utils/errors");
    await expect(
      AuthService.register({
        email: "exists@erp.local",
        password: "Pass@1234",
        role: "ADMIN",
        name: "Admin",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("throws ValidationError for STUDENT missing rollNumber", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const { ValidationError } = await import("@/lib/utils/errors");
    await expect(
      AuthService.register({
        email: "s@erp.local",
        password: "Pass@1234",
        role:     "STUDENT",
        name:     "Student",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("calls $transaction and returns safe user for ADMIN role", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue("$hashed");
    const newUser = { id: "new-1", email: "newadmin@erp.local", role: "ADMIN" };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
      const tx = {
        user:   { create: vi.fn().mockResolvedValue(newUser) },
        admin:  { create: vi.fn().mockResolvedValue({}) },
        student: { create: vi.fn() },
      } as unknown as typeof mockPrisma;
      return fn(tx);
    });

    const result = await AuthService.register({
      email:    "newadmin@erp.local",
      password: "Admin@1234",
      role:     "ADMIN",
      name:     "New Admin",
    });

    expect(result).toEqual({ id: "new-1", email: "newadmin@erp.local", role: "ADMIN" });
  });
});
