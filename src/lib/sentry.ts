import * as Sentry from "@sentry/nextjs";
import { sanitizeForLog } from "./errors/sanitize-log";

export function captureServerActionError(
  error: unknown,
  actionName: string,
  userId?: string
): void {
  const sanitizedContext = error instanceof Error
    ? { message: error.message, name: error.name }
    : { raw: String(error) };

  Sentry.withScope((scope) => {
    scope.setTag("action", actionName);
    if (userId) {
      scope.setUser({ id: userId });
    }
    scope.setContext("action", {
      name: actionName,
      ...sanitizeForLog(sanitizedContext as Record<string, unknown>),
    });
    Sentry.captureException(error);
  });
}

export function setUserContext(userId: string, email?: string): void {
  Sentry.setUser({
    id: userId,
    email: email ? `[REDACTED]` : undefined,
  });
}

export function clearUserContext(): void {
  Sentry.setUser(null);
}
