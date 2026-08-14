import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicEnvironment, hasPublicSupabaseConfiguration } from "@/lib/env/public";
import type { Database } from "@/lib/supabase/database.types";

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasPublicSupabaseConfiguration()) {
    return response;
  }

  const environment = getPublicEnvironment();
  const supabase = createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL!,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([name, value]) =>
            response.headers.set(name, value),
          );
        },
      },
    },
  );

  // getClaims verifies the JWT and refreshes expiring cookies when required.
  // Route-level data access still performs its own authorization checks.
  await supabase.auth.getClaims();

  return response;
}
