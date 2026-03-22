import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { hasSliceHeaders, verifySliceRequest } from "./slice";
import type { NextRequest } from "next/server";

// Lazy singleton — createClient() is deferred until first use so Vercel build doesn't
// crash when env vars are missing (they're set in the Vercel dashboard, not .env).
let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.SUPABASE_SERVICE_KEY ?? "";
    if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel environment variables.");
    _admin = createClient(url, key);
  }
  return _admin;
}

// Proxy lets callers use `supabaseAdmin.from(...)` / `supabaseAdmin.auth.*`
// exactly as before — the real client is only created on first property access at runtime.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_: SupabaseClient, prop: string | symbol) {
    return getAdmin()[prop as keyof SupabaseClient];
  },
});

// Pull userId from Supabase JWT
export async function getUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * Unified auth: tries Slice ERC-8128 wallet auth first, falls back to Supabase JWT.
 * Use this in all API routes instead of getUserId().
 */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  if (hasSliceHeaders(req)) {
    return verifySliceRequest(req);
  }
  return getUserId(req.headers.get("authorization"));
}
