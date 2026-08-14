import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const localOwnerEmail = "owner@example.test";
const supabaseCli = resolve("node_modules/supabase/dist/supabase.js");
const playwrightCli = resolve("node_modules/@playwright/test/cli.js");

function runCli(script, arguments_, options = {}) {
  return spawnSync(process.execPath, [script, ...arguments_], {
    cwd: process.cwd(),
    encoding: "utf8",
    ...options,
  });
}

function requireSuccess(result, label) {
  if (result.status === 0) return;
  if (result.stderr) process.stderr.write(result.stderr);
  throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}.`);
}

function parseStatusValue(statusOutput, name) {
  const match = statusOutput.match(new RegExp(`${name}="([^"]+)"`));
  if (!match?.[1]) throw new Error(`Local Supabase status did not provide ${name}.`);
  return match[1];
}

let status = runCli(supabaseCli, ["status", "-o", "env"]);
let startedForTest = false;

if (status.status !== 0) {
  const start = runCli(supabaseCli, [
    "start",
    "-x",
    "realtime,storage-api,imgproxy,studio,edge-runtime,logflare,vector,supavisor",
  ]);
  requireSuccess(start, "Starting local Supabase");
  startedForTest = true;
  status = runCli(supabaseCli, ["status", "-o", "env"]);
}

requireSuccess(status, "Reading local Supabase status");
const statusOutput = status.stdout ?? "";
const apiUrl = parseStatusValue(statusOutput, "API_URL");
const publishableKey = parseStatusValue(statusOutput, "PUBLISHABLE_KEY");

if (!apiUrl.startsWith("http://127.0.0.1:")) {
  throw new Error("Authenticated E2E refuses to reset a non-local Supabase project.");
}

try {
  process.stdout.write("Resetting the fake-only local test database...\n");
  requireSuccess(
    runCli(supabaseCli, ["db", "reset", "--local"], { stdio: "inherit" }),
    "Resetting local Supabase",
  );

  const testEnvironment = {
    ...process.env,
    NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3001",
    NEXT_PUBLIC_SUPABASE_URL: apiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    OWNER_EMAIL_ALLOWLIST: localOwnerEmail,
    DEFAULT_CURRENCY: "ZMW",
    PROJECT_TIMEZONE: "Africa/Lusaka",
  };

  requireSuccess(
    runCli(playwrightCli, ["test", "--config", "playwright.auth.config.ts"], {
      env: testEnvironment,
      stdio: "inherit",
    }),
    "Authenticated browser test",
  );
} finally {
  if (startedForTest) {
    runCli(supabaseCli, ["stop"], { stdio: "ignore" });
  }
}
