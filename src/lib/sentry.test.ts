import { describe, it, expect, vi, beforeEach } from "vitest";
import { captureServerActionError, setUserContext, clearUserContext } from "./sentry";

// Mock Sentry
const mockSetTag = vi.fn();
const mockSetUser = vi.fn();
const mockSetContext = vi.fn();
const mockWithScope = vi.fn((cb) => {
  cb({
    setTag: mockSetTag,
    setUser: mockSetUser,
    setContext: mockSetContext,
  });
});
const mockCaptureException = vi.fn();
const mockSetUserGlobal = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  withScope: (cb: unknown) => mockWithScope(cb),
  captureException: (err: unknown) => mockCaptureException(err),
  setUser: (user: unknown) => mockSetUserGlobal(user),
}));

describe("sentry helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captureServerActionError sets action tag and user", () => {
    captureServerActionError(new Error("fail"), "createMaleta", "user-123");
    expect(mockWithScope).toHaveBeenCalled();
    expect(mockSetTag).toHaveBeenCalledWith("action", "createMaleta");
    expect(mockSetUser).toHaveBeenCalledWith({ id: "user-123" });
    expect(mockCaptureException).toHaveBeenCalled();
  });

  it("setUserContext sets only id and redacted email", () => {
    setUserContext("user-123", "test@example.com");
    expect(mockSetUserGlobal).toHaveBeenCalledWith({ id: "user-123", email: "[REDACTED]" });
  });

  it("clearUserContext clears user", () => {
    clearUserContext();
    expect(mockSetUserGlobal).toHaveBeenCalledWith(null);
  });
});
