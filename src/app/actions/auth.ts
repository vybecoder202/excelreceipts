"use server";

import { redirect } from "next/navigation";

import { hasPublicSupabaseConfiguration } from "@/lib/env/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signOutAction() {
  if (hasPublicSupabaseConfiguration()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/sign-in");
}
