"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicEnvironment } from "@/lib/env/public";
import type { Database } from "@/lib/supabase/database.types";

export function createBrowserSupabaseClient() {
  const environment = getPublicEnvironment();
  if (
    !environment.NEXT_PUBLIC_SUPABASE_URL ||
    !environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error("Supabase is not configured for this environment.");
  }

  return createBrowserClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
