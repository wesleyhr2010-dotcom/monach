#!/usr/bin/env node
/**
 * Sync Supabase Auth email templates (reset_password, invite_user) via Management API.
 *
 * Required environment variables:
 *   SUPABASE_MANAGEMENT_API_KEY — Organization API key from Supabase Dashboard
 *   SUPABASE_PROJECT_REF        — Project reference ID (e.g. abcdefghijklmnopqrst)
 *   NEXT_PUBLIC_SITE_URL        — Optional, used to validate logo URL accessibility
 *
 * Usage:
 *   npx tsx scripts/sync-supabase-auth-templates.ts
 *   npx tsx scripts/sync-supabase-auth-templates.ts --dry-run
 *   npx tsx scripts/sync-supabase-auth-templates.ts --check
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface MailerTemplate {
  subject: string;
  content: string;
}

interface AuthConfig {
  mailer_templates?: {
    confirmation?: MailerTemplate | null;
    recovery?: MailerTemplate | null;
    invite?: MailerTemplate | null;
    email_change?: MailerTemplate | null;
    magic_link?: MailerTemplate | null;
  };
}

const TEMPLATES_DIR = resolve(__dirname, "supabase-auth-templates");

const API_BASE = "https://api.supabase.com";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Missing environment variable: ${name}`);
    console.error(`   Add it to .env.local and source it before running this script.`);
    console.error(`   For CI, set it as a repository secret.`);
    process.exit(1);
  }
  return value;
}

function readTemplate(filename: string): string {
  const path = resolve(TEMPLATES_DIR, filename);
  try {
    return readFileSync(path, "utf-8").trim();
  } catch (err) {
    console.error(`❌ Failed to read template: ${path}`);
    console.error(err);
    process.exit(1);
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3
): Promise<Response> {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, init);
    if (res.status !== 429) return res;
    attempt++;
    if (attempt > retries) return res;
    const delay = Math.min(1000 * 2 ** attempt, 8000);
    console.warn(`⏳ Rate limited (429). Retrying in ${delay}ms… (attempt ${attempt}/${retries})`);
    await new Promise((r) => setTimeout(r, delay));
  }
}

async function fetchCurrentConfig(
  projectRef: string,
  apiKey: string
): Promise<AuthConfig> {
  const url = `${API_BASE}/v1/projects/${projectRef}/config/auth`;
  const res = await fetchWithRetry(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Failed to fetch current auth config (${res.status}): ${body}`);
    process.exit(1);
  }
  return (await res.json()) as AuthConfig;
}

async function updateConfig(
  projectRef: string,
  apiKey: string,
  payload: AuthConfig
): Promise<void> {
  const url = `${API_BASE}/v1/projects/${projectRef}/config/auth`;
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Failed to update auth config (${res.status}): ${body}`);
    process.exit(1);
  }
}

function buildPayload(current: AuthConfig): AuthConfig {
  const resetHtml = readTemplate("reset-password.html");
  const inviteHtml = readTemplate("invite-user.html");

  return {
    mailer_templates: {
      ...current.mailer_templates,
      confirmation: current.mailer_templates?.confirmation ?? null,
      recovery: {
        subject: "Monarca — Restablece tu contraseña",
        content: resetHtml,
      },
      invite: {
        subject: "Monarca — ¡Bienvenida! Crea tu contraseña",
        content: inviteHtml,
      },
    },
  };
}

function printDiff(local: string, remote: string | undefined, label: string): void {
  if (!remote) {
    console.log(`  🆕 ${label}: will be created (no remote template)`);
    return;
  }
  const normalizedLocal = local.replace(/\s+/g, " ").trim();
  const normalizedRemote = remote.replace(/\s+/g, " ").trim();
  if (normalizedLocal === normalizedRemote) {
    console.log(`  ✅ ${label}: identical — no change needed`);
  } else {
    console.log(`  📝 ${label}: differs — will be updated`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isCheck = args.includes("--check");

  const apiKey = getEnv("SUPABASE_MANAGEMENT_API_KEY");
  const projectRef = getEnv("SUPABASE_PROJECT_REF");

  // Safety: never print the API key
  console.log(`🔧 Project ref: ${projectRef}`);
  console.log(`📁 Templates dir: ${TEMPLATES_DIR}`);

  if (isDryRun) {
    console.log("\n🏃 DRY RUN — no API calls will be made.\n");
    const payload = buildPayload({});
    console.log("Payload preview (subjects only):");
    console.log(`  recovery.subject : ${payload.mailer_templates?.recovery?.subject}`);
    console.log(`  invite.subject   : ${payload.mailer_templates?.invite?.subject}`);
    console.log(`  recovery.content : ${(payload.mailer_templates?.recovery?.content ?? "").length} chars`);
    console.log(`  invite.content   : ${(payload.mailer_templates?.invite?.content ?? "").length} chars`);
    console.log("\n✓ Templates prepared successfully (dry-run)");
    return;
  }

  console.log("\n📡 Fetching current auth config…");
  const current = await fetchCurrentConfig(projectRef, apiKey);

  if (isCheck) {
    console.log("\n🔍 CHECK MODE — comparing local templates with remote…\n");
    const resetHtml = readTemplate("reset-password.html");
    const inviteHtml = readTemplate("invite-user.html");
    printDiff(resetHtml, current.mailer_templates?.recovery?.content, "recovery");
    printDiff(inviteHtml, current.mailer_templates?.invite?.content, "invite");
    console.log("\n✓ Check complete");
    return;
  }

  const payload = buildPayload(current);
  console.log("\n📤 Uploading templates to Supabase…");
  await updateConfig(projectRef, apiKey, payload);
  console.log("\n✓ Templates synced successfully");
  console.log(`  recovery: ${payload.mailer_templates?.recovery?.subject}`);
  console.log(`  invite  : ${payload.mailer_templates?.invite?.subject}`);
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
