import { describe, expect, it } from "vitest";

import { assertProductionEnvironment, parseServerEnvironment } from "./server";

describe("server environment", () => {
  it("allows an unconfigured local foundation without inventing production values", () => {
    expect(parseServerEnvironment({})).toMatchObject({
      APP_ENV: "development",
      TAX_ENABLED: "false",
      AI_FEATURES_ENABLED: "false",
    });
  });

  it("fails closed when production configuration is incomplete", () => {
    expect(() =>
      assertProductionEnvironment({
        APP_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://buildledger.example",
      }),
    ).toThrow(/Production configuration is incomplete/);
  });

  it("does not include secret values in validation errors", () => {
    const secret = "do-not-print-this-secret";

    expect(() =>
      assertProductionEnvironment({
        APP_ENV: "production",
        NEXT_PUBLIC_APP_URL: "not-a-url",
        SUPABASE_SERVICE_ROLE_KEY: secret,
      }),
    ).toThrowError(expect.not.stringContaining(secret));
  });
});
