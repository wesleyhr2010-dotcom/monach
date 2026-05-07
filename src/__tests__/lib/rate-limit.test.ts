import { describe, it, expect } from "vitest";
import { checkRateLimit, isAdminRole, rateLimiters } from "@/lib/rate-limit";
import { createRateLimitResponse, RATE_LIMIT_MESSAGES } from "@/lib/rate-limit-errors";

describe("isAdminRole", () => {
  it("returns true for ADMIN", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
  });

  it("returns true for COLABORADORA", () => {
    expect(isAdminRole("COLABORADORA")).toBe(true);
  });

  it("returns false for REVENDEDORA", () => {
    expect(isAdminRole("REVENDEDORA")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });

  it("returns false for unknown roles", () => {
    expect(isAdminRole("SUPERUSER")).toBe(false);
  });
});

describe("checkRateLimit", () => {
  it("returns success=true when limiter is null (Redis unavailable)", async () => {
    const result = await checkRateLimit(null, "any-key");
    expect(result.success).toBe(true);
    expect(result.limit).toBe(Infinity);
    expect(result.remaining).toBe(Infinity);
  });

  it("returns success=true with remaining>0 when limit not exceeded", async () => {
    // rateLimiters.trackEvento may be null in test env
    if (!rateLimiters.trackEvento) {
      // Skip if no Redis in test environment
      return;
    }
    const key = `test:${Date.now()}:${Math.random()}`;
    const result = await checkRateLimit(rateLimiters.trackEvento, key);
    expect(result.success).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(result.limit).toBe(100);
  });
});

describe("createRateLimitResponse", () => {
  it("returns 429 status with JSON body", () => {
    const response = createRateLimitResponse(60);
    expect(response.status).toBe(429);
  });

  it("includes Retry-After header", () => {
    const response = createRateLimitResponse(45);
    expect(response.headers.get("Retry-After")).toBe("45");
  });

  it("includes X-RateLimit-Remaining: 0", () => {
    const response = createRateLimitResponse(30);
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("uses default Spanish message when no custom message provided", async () => {
    const response = createRateLimitResponse(60);
    const body = await response.json();
    expect(body.error).toBe(RATE_LIMIT_MESSAGES.default);
    expect(body.retry_after).toBe(60);
  });

  it("uses custom message when provided", async () => {
    const response = createRateLimitResponse(60, "Custom message");
    const body = await response.json();
    expect(body.error).toBe("Custom message");
  });

  it("messages are in Spanish (paraguayan)", () => {
    // Spot-check that messages contain Spanish words, not English or Portuguese
    expect(RATE_LIMIT_MESSAGES.default).toMatch(/solicitudes|esper[áa]|prob[áa]/i);
    expect(RATE_LIMIT_MESSAGES.track).toMatch(/eventos|esper[áa]|minuto/i);
    expect(RATE_LIMIT_MESSAGES.upload).toMatch(/archivos|subidos|esper[áa]|subir/i);
  });
});
