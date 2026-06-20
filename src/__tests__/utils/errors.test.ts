import { describe, it, expect } from "vitest";
import {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  isAppError,
  isPrismaConflict,
} from "@/lib/utils/errors";

describe("AppError subclasses", () => {
  it("AuthError has status 401 and code AUTH_001", () => {
    const err = new AuthError("bad creds");
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("AUTH_001");
    expect(err.message).toBe("bad creds");
  });

  it("AuthError uses default message", () => {
    expect(new AuthError().message).toBe("Authentication failed");
  });

  it("ForbiddenError has status 403 and code AUTH_002", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("AUTH_002");
  });

  it("NotFoundError has status 404 and code RES_001", () => {
    const err = new NotFoundError("Company not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("RES_001");
    expect(err.message).toBe("Company not found");
  });

  it("ConflictError has status 409 and code RES_002", () => {
    const err = new ConflictError("Email already in use");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("RES_002");
  });

  it("ValidationError has status 400 and code VAL_001", () => {
    const err = new ValidationError("Bad input", { field: "email" });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VAL_001");
    expect(err.details).toEqual({ field: "email" });
  });

  it("RateLimitError has status 429 and code RATE_001", () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe("RATE_001");
  });
});

describe("isAppError", () => {
  it("returns true for AppError instances", () => {
    expect(isAppError(new NotFoundError())).toBe(true);
    expect(isAppError(new AuthError())).toBe(true);
  });

  it("returns false for plain Error", () => {
    expect(isAppError(new Error("plain"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError("string error")).toBe(false);
    expect(isAppError(42)).toBe(false);
  });
});

describe("isPrismaConflict", () => {
  it("returns true for Prisma P2002 error shape", () => {
    expect(isPrismaConflict({ code: "P2002" })).toBe(true);
  });

  it("returns false for other error codes", () => {
    expect(isPrismaConflict({ code: "P2003" })).toBe(false);
  });

  it("returns false for non-object values", () => {
    expect(isPrismaConflict(null)).toBe(false);
    expect(isPrismaConflict("P2002")).toBe(false);
  });
});
