import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Sanitize breadcrumbs to ensure no PII leaks
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
        ...crumb,
        message: crumb.message ? sanitizeString(crumb.message) : crumb.message,
      }));
    }
    return event;
  },
});

function sanitizeString(str: string): string {
  // Basic regex to redact emails — full sanitization handled in OBS-04
  return str.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[REDACTED_EMAIL]");
}
