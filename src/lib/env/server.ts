import { serverEnvironmentSchema, type ServerEnvironment } from "./schema";

const requiredProductionKeys = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "OWNER_EMAIL_ALLOWLIST",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GOOGLE_DRIVE_REDIRECT_URI",
  "GOOGLE_TOKEN_ENCRYPTION_KEY",
] as const;

type EnvironmentSource = Record<string, string | undefined>;

export function parseServerEnvironment(source: EnvironmentSource): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse(source);

  if (!result.success) {
    throw new Error("Server configuration is invalid. Review environment variable names and formats.");
  }

  return result.data;
}

export function assertProductionEnvironment(source: EnvironmentSource) {
  const environment = parseServerEnvironment(source);
  if (environment.APP_ENV !== "production") return environment;

  const missing = requiredProductionKeys.filter((key) => !environment[key]);
  if (missing.length > 0) {
    throw new Error(
      `Production configuration is incomplete. Missing variables: ${missing.join(", ")}. Values were not logged.`,
    );
  }

  if (!environment.DEFAULT_CURRENCY || !environment.PROJECT_TIMEZONE) {
    throw new Error(
      "Production project defaults are incomplete. Set DEFAULT_CURRENCY and PROJECT_TIMEZONE. Values were not logged.",
    );
  }

  return environment;
}

export function getFoundationReadiness(source: EnvironmentSource) {
  const environment = parseServerEnvironment(source);

  return {
    appEnvironment: environment.APP_ENV,
    supabaseConfigured: Boolean(
      environment.NEXT_PUBLIC_SUPABASE_URL &&
        environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    ownerConfigured: Boolean(environment.OWNER_EMAIL_ALLOWLIST),
    driveConfigured: Boolean(
      environment.GOOGLE_OAUTH_CLIENT_ID &&
        environment.GOOGLE_OAUTH_CLIENT_SECRET &&
        environment.GOOGLE_TOKEN_ENCRYPTION_KEY,
    ),
    projectDefaultsConfigured: Boolean(
      environment.DEFAULT_CURRENCY && environment.PROJECT_TIMEZONE,
    ),
  };
}
