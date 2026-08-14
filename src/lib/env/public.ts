import { publicEnvironmentSchema, type PublicEnvironment } from "./schema";

let cachedEnvironment: PublicEnvironment | undefined;

export function getPublicEnvironment(): PublicEnvironment {
  if (cachedEnvironment) return cachedEnvironment;

  const result = publicEnvironmentSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    throw new Error("Public application configuration is invalid. Review the environment settings.");
  }

  cachedEnvironment = result.data;
  return result.data;
}

export function hasPublicSupabaseConfiguration() {
  const environment = getPublicEnvironment();
  return Boolean(
    environment.NEXT_PUBLIC_SUPABASE_URL &&
      environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
