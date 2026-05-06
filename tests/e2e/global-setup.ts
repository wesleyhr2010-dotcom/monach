import dotenv from "dotenv";
import path from "path";

// Ensure test env is loaded before anything else runs
const envTestPath = path.resolve(process.cwd(), ".env.test");
dotenv.config({ path: envTestPath });

/**
 * Playwright Global Setup
 * Validates required environment variables before the test suite runs.
 */
export default async function globalSetup() {
  const required = [
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[E2E Setup] Missing required environment variables: ${missing.join(", ")}\n` +
        `Copy .env.test.example to .env.test and fill in the values.`
    );
  }

  // Safety guard: ensure DATABASE_URL points to a test/local database
  const dbUrl = process.env.DATABASE_URL || "";
  const isSafe =
    dbUrl.includes("localhost") ||
    dbUrl.includes("127.0.0.1") ||
    dbUrl.includes("test") ||
    dbUrl.includes("54322"); // Supabase local default port

  if (!isSafe) {
    throw new Error(
      `[E2E Setup] DATABASE_URL does not appear to point to a test/local database: ${dbUrl}\n` +
        `Refusing to run E2E tests against a potentially production database.`
    );
  }

  console.log("[E2E Setup] Environment validated. Starting test suite...");
}
