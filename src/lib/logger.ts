import { sanitizeForLog } from "./errors/sanitize-log";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service?: string;
  context?: Record<string, unknown>;
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: process.env.VERCEL_PROJECT_NAME || "next-monarca",
    context: context ? sanitizeForLog(context) : undefined,
  };

  const serialized = JSON.stringify(entry);

  switch (level) {
    case "debug":
      // Only log debug in development
      if (process.env.NODE_ENV === "development") {
        console.log(serialized);
      }
      break;
    case "info":
      console.log(serialized);
      break;
    case "warn":
      console.warn(serialized);
      break;
    case "error":
      console.error(serialized);
      break;
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => write("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => write("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => write("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => write("error", msg, ctx),
};
