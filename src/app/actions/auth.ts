"use server";

import { redirect } from "next/navigation";

import {
  isLocalDemoEnabled,
  LOCAL_DEMO_EMAIL,
  LOCAL_DEMO_PASSWORD,
} from "@/lib/auth/local-demo";
import { safeNextPath } from "@/lib/auth/navigation";
import { hasPublicSupabaseConfiguration } from "@/lib/env/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LocalDemoSignInState = {
  status: "idle" | "error";
  message?: string;
};

export async function signInLocalDemoAction(
  _previousState: LocalDemoSignInState,
  formData: FormData,
): Promise<LocalDemoSignInState> {
  if (!isLocalDemoEnabled(process.env)) {
    return {
      status: "error",
      message: "Local demo access is not available in this environment.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: LOCAL_DEMO_EMAIL,
    password: LOCAL_DEMO_PASSWORD,
  });

  if (error) {
    return {
      status: "error",
      message: "The fake local owner could not be signed in. Reset the local demo database and retry.",
    };
  }

  redirect(safeNextPath(String(formData.get("next") ?? "/")));
}

export async function signOutAction() {
  if (hasPublicSupabaseConfiguration()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/sign-in");
}
