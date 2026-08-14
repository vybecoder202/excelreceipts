import { NextRequest, NextResponse } from "next/server";

import { hasPublicSupabaseConfiguration } from "@/lib/env/public";
import { safeNextPath } from "@/lib/auth/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function privateRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code || !hasPublicSupabaseConfiguration()) {
    return privateRedirect(new URL("/sign-in?error=configuration", requestUrl.origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return privateRedirect(new URL("/sign-in?error=callback", requestUrl.origin));
  }

  return privateRedirect(new URL(next, requestUrl.origin));
}
