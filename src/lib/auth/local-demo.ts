import { isOwnerEmailAllowlisted } from "./owner-allowlist";
import { parseServerEnvironment } from "../env/server";

export const LOCAL_DEMO_EMAIL = "owner@example.test";
export const LOCAL_DEMO_PASSWORD = "local-test-only";

type EnvironmentSource = Record<string, string | undefined>;

export function isLocalDemoEnabled(source: EnvironmentSource) {
  const environment = parseServerEnvironment(source);
  if (environment.APP_ENV !== "development" || environment.LOCAL_DEMO_MODE !== "true") {
    return false;
  }

  if (
    !environment.NEXT_PUBLIC_SUPABASE_URL ||
    !isOwnerEmailAllowlisted(LOCAL_DEMO_EMAIL, environment.OWNER_EMAIL_ALLOWLIST)
  ) {
    return false;
  }

  try {
    const url = new URL(environment.NEXT_PUBLIC_SUPABASE_URL);
    return (
      url.protocol === "http:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}
