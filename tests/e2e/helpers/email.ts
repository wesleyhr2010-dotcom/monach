import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase URL or service role key");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Generate a password recovery link via Supabase Admin API.
 * This bypasses the email step and is more reliable in E2E tests.
 */
export async function generateRecoveryLink(email: string): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (error) {
    throw new Error(`Failed to generate recovery link: ${error.message}`);
  }

  // The recovery link contains a token hash that can be used directly
  // We return the action_link which is the full URL
  return data.properties.action_link;
}

/**
 * Extract the token hash from a Supabase recovery link.
 * Useful if you need to construct a custom redirect URL.
 */
export function extractTokenFromLink(link: string): string {
  const url = new URL(link);
  const token = url.searchParams.get("token");
  if (!token) {
    throw new Error("No token found in recovery link");
  }
  return token;
}
