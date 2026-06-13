export const ErrorCodes = {
  UNAUTHORIZED:        "AUTH_001",
  FORBIDDEN:           "AUTH_002",
  TOKEN_EXPIRED:       "AUTH_003",
  VALIDATION_ERROR:    "VAL_001",
  NOT_FOUND:           "RES_001",
  CONFLICT:            "RES_002",
  RATE_LIMITED:        "RATE_001",
  INTERNAL_ERROR:      "SRV_001",
  DRIVE_UPLOAD_FAILED: "DRIVE_001",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ApiResponse = {
  success: <T>(data: T, meta?: object) => ({
    success: true,
    data,
    meta: meta ?? null,
    timestamp: new Date().toISOString(),
  }),

  error: (code: string, message: string, details?: unknown) => ({
    success: false,
    error: { code, message, details: details ?? null },
    timestamp: new Date().toISOString(),
  }),

  paginated: <T>(data: T[], total: number, page: number, limit: number) => ({
    success: true,
    data,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    timestamp: new Date().toISOString(),
  }),
};
