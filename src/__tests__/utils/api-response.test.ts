import { describe, it, expect } from "vitest";
import { ApiResponse, ErrorCodes } from "@/lib/utils/api-response";

describe("ApiResponse.success", () => {
  it("returns success shape with null meta by default", () => {
    const result = ApiResponse.success({ id: "1", name: "test" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: "1", name: "test" });
    expect(result.meta).toBeNull();
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("includes meta when provided", () => {
    const result = ApiResponse.success("payload", { extra: true });
    expect(result.meta).toEqual({ extra: true });
  });
});

describe("ApiResponse.error", () => {
  it("returns error shape with null details by default", () => {
    const result = ApiResponse.error(ErrorCodes.NOT_FOUND, "Not found");
    expect(result.success).toBe(false);
    expect(result.error.code).toBe("RES_001");
    expect(result.error.message).toBe("Not found");
    expect(result.error.details).toBeNull();
  });

  it("includes details when provided", () => {
    const result = ApiResponse.error(ErrorCodes.VALIDATION_ERROR, "Bad input", { field: "email" });
    expect(result.error.details).toEqual({ field: "email" });
  });
});

describe("ApiResponse.paginated", () => {
  it("computes pages correctly", () => {
    const result = ApiResponse.paginated([1, 2, 3], 25, 1, 10);
    expect(result.success).toBe(true);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.pages).toBe(3);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it("rounds up pages correctly", () => {
    const result = ApiResponse.paginated([], 11, 2, 10);
    expect(result.pagination.pages).toBe(2);
  });

  it("returns 0 pages for 0 total", () => {
    const result = ApiResponse.paginated([], 0, 1, 10);
    expect(result.pagination.pages).toBe(0);
  });
});

describe("ErrorCodes", () => {
  it("exports all expected codes", () => {
    expect(ErrorCodes.UNAUTHORIZED).toBe("AUTH_001");
    expect(ErrorCodes.FORBIDDEN).toBe("AUTH_002");
    expect(ErrorCodes.VALIDATION_ERROR).toBe("VAL_001");
    expect(ErrorCodes.NOT_FOUND).toBe("RES_001");
    expect(ErrorCodes.CONFLICT).toBe("RES_002");
    expect(ErrorCodes.RATE_LIMITED).toBe("RATE_001");
    expect(ErrorCodes.INTERNAL_ERROR).toBe("SRV_001");
  });
});
