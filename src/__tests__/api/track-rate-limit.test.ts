import { describe, it, expect } from "vitest";
import { createRateLimitResponse } from "@/lib/rate-limit-errors";

describe("Rate limit 429 response structure", () => {
  it("response body contains error and retry_after fields", async () => {
    const response = createRateLimitResponse(120, "Demasiadas solicitudes");
    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("retry_after");
    expect(body.error).toBe("Demasiadas solicitudes");
    expect(body.retry_after).toBe(120);
  });

  it("response has correct content-type header", () => {
    const response = createRateLimitResponse(60);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("response has all required rate limit headers", () => {
    const response = createRateLimitResponse(90);
    expect(response.headers.get("Retry-After")).toBe("90");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("0");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});

describe("Rate limit message language", () => {
  it("default message is in Spanish paraguayan", async () => {
    const response = createRateLimitResponse(60);
    const body = await response.json();
    // Spanish indicators: "solicitudes", "esperá" (voseo), "probá" (voseo)
    expect(body.error).toMatch(/esper[áa]|prob[áa]|solicitud/i);
  });
});
