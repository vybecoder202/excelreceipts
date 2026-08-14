import "server-only";

import { cache } from "react";

import { isOwnerEmailAllowlisted, normalizeEmail } from "@/lib/auth/owner-allowlist";
import type { ApplicationAccessContext } from "@/lib/auth/types";
import { hasPublicSupabaseConfiguration } from "@/lib/env/public";
import { parseServerEnvironment } from "@/lib/env/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function claimString(claims: Record<string, unknown>, key: string) {
  const value = claims[key];
  return typeof value === "string" ? value : "";
}

function claimDisplayName(claims: Record<string, unknown>) {
  const metadata = claims.user_metadata;
  if (!metadata || typeof metadata !== "object") return "Project owner";

  const record = metadata as Record<string, unknown>;
  for (const key of ["full_name", "name"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "Project owner";
}

export const getApplicationAccess = cache(async (): Promise<ApplicationAccessContext> => {
  if (!hasPublicSupabaseConfiguration()) {
    return {
      mode: "foundation",
      user: null,
      project: null,
      canCreateProject: false,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as Record<string, unknown> | undefined;
  const userId = claims ? claimString(claims, "sub") : "";

  if (claimsError || !claims || !userId) {
    return {
      mode: "configured",
      user: null,
      project: null,
      canCreateProject: false,
    };
  }

  const claimedEmail = normalizeEmail(claimString(claims, "email"));
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("project_memberships")
      .select("project_id, role_code")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  let project = null;
  if (membership) {
    const [{ data: projectRow }, { data: settings }] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, reference, status")
        .eq("id", membership.project_id)
        .maybeSingle(),
      supabase
        .from("project_settings")
        .select("currency_code, timezone")
        .eq("project_id", membership.project_id)
        .maybeSingle(),
    ]);

    if (projectRow && settings) {
      project = {
        id: projectRow.id,
        name: projectRow.name,
        reference: projectRow.reference,
        status: projectRow.status,
        currencyCode: settings.currency_code,
        timezone: settings.timezone,
        role: membership.role_code,
      };
    }
  }

  const email = normalizeEmail(profile?.email ?? claimedEmail);
  const environment = parseServerEnvironment(process.env);

  return {
    mode: "authenticated",
    user: {
      id: userId,
      email,
      displayName: profile?.display_name?.trim() || claimDisplayName(claims),
    },
    project,
    canCreateProject:
      !project && isOwnerEmailAllowlisted(email, environment.OWNER_EMAIL_ALLOWLIST),
  };
});
