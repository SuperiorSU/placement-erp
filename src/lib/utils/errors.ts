export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401, "AUTH_001");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "AUTH_002");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "RES_001");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409, "RES_002");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", public readonly details?: unknown) {
    super(message, 400, "VAL_001");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_001");
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function isPrismaConflict(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}
