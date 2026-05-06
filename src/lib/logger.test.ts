import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  let logs: string[] = [];

  beforeEach(() => {
    logs = [];
    vi.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
    vi.spyOn(console, "error").mockImplementation((msg) => logs.push(msg));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("outputs structured JSON with level, message, timestamp", () => {
    logger.info("hello");
    const parsed = JSON.parse(logs[0]);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("hello");
    expect(typeof parsed.timestamp).toBe("string");
  });

  it("redacts PII fields from context", () => {
    logger.error("user login failed", { userId: "123", email: "test@example.com" });
    const parsed = JSON.parse(logs[0]);
    expect(parsed.context.userId).toBe("123");
    expect(parsed.context.email).toBe("[REDACTED]");
  });

  it("redacts nested PII", () => {
    logger.error("db error", { user: { id: "1", name: "Ana", ci_ruc: "12345" } });
    const parsed = JSON.parse(logs[0]);
    expect(parsed.context.user.id).toBe("1");
    expect(parsed.context.user.name).toBe("[REDACTED]");
    expect(parsed.context.user.ci_ruc).toBe("[REDACTED]");
  });
});
