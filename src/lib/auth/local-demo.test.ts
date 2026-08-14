import { describe, expect, it } from "vitest";

import { isLocalDemoEnabled } from "./local-demo";

const localEnvironment = {
  APP_ENV: "development",
  LOCAL_DEMO_MODE: "true",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-publishable-key",
  OWNER_EMAIL_ALLOWLIST: "owner@example.test",
};

describe("local demo access", () => {
  it("allows the explicit fake owner only against loopback Supabase", () => {
    expect(isLocalDemoEnabled(localEnvironment)).toBe(true);
  });

  it("cannot be enabled for production", () => {
    expect(isLocalDemoEnabled({ ...localEnvironment, APP_ENV: "production" })).toBe(false);
  });

  it("cannot target a hosted Supabase project", () => {
    expect(
      isLocalDemoEnabled({
        ...localEnvironment,
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toBe(false);
  });

  it("requires the fake owner allowlist entry", () => {
    expect(
      isLocalDemoEnabled({
        ...localEnvironment,
        OWNER_EMAIL_ALLOWLIST: "someone-else@example.test",
      }),
    ).toBe(false);
  });
});
