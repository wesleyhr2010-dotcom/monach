import { NextResponse } from "next/server";

export const RATE_LIMIT_MESSAGES = {
  default:
    "Demasiadas solicitudes. Por favor, esperá un momento y probá de nuevo.",
  track: "Demasiados eventos registrados. Esperá un minuto antes de continuar.",
  upload:
    "Demasiados archivos subidos. Esperá un minuto antes de subir otro.",
};

export function createRateLimitResponse(
  retryAfterSeconds: number,
  message?: string
): NextResponse {
  const body = {
    error: message || RATE_LIMIT_MESSAGES.default,
    retry_after: retryAfterSeconds,
  };

  return NextResponse.json(body, {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSeconds),
      "X-RateLimit-Limit": "0",
      "X-RateLimit-Remaining": "0",
    },
  });
}
