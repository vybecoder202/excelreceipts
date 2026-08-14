import { z } from "zod";

const optionalSecret = z.string().trim().min(1).optional();

export const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalSecret,
});

export const serverEnvironmentSchema = publicEnvironmentSchema.extend({
  APP_ENV: z.enum(["development", "preview", "test", "production"]).default("development"),
  OWNER_EMAIL_ALLOWLIST: optionalSecret,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  DATABASE_URL: optionalSecret,
  GOOGLE_OAUTH_CLIENT_ID: optionalSecret,
  GOOGLE_OAUTH_CLIENT_SECRET: optionalSecret,
  GOOGLE_DRIVE_REDIRECT_URI: z.url().optional(),
  GOOGLE_TOKEN_ENCRYPTION_KEY: optionalSecret,
  GOOGLE_DRIVE_ROOT_FOLDER_ID: optionalSecret,
  GOOGLE_DRIVE_BACKUP_FOLDER_ID: optionalSecret,
  DEFAULT_CURRENCY: z.string().trim().length(3).toUpperCase().optional(),
  PROJECT_TIMEZONE: optionalSecret,
  TAX_ENABLED: z.enum(["true", "false"]).default("false"),
  DEFAULT_TAX_METHOD: z.enum(["exclusive", "inclusive"]).default("exclusive"),
  WAGE_RATE_METHODS: optionalSecret,
  AI_FEATURES_ENABLED: z.enum(["true", "false"]).default("false"),
  AI_PROVIDER: optionalSecret,
  AI_API_KEY: optionalSecret,
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
