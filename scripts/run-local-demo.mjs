import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const localOwnerEmail = "owner@example.test";
const supabaseCli = resolve("node_modules/supabase/dist/supabase.js");
const nextCli = resolve("node_modules/next/dist/bin/next");

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
if (status.status !== 0) {
  process.stdout.write("Starting the fake-only local database…\n");
  const start = runCli(
    supabaseCli,
    [
      "start",
      "-x",
      "realtime,storage-api,imgproxy,studio,edge-runtime,logflare,vector,supavisor",
    ],
    { stdio: "inherit" },
  );
  requireSuccess(start, "Starting local Supabase");
  status = runCli(supabaseCli, ["status", "-o", "env"]);
}

requireSuccess(status, "Reading local Supabase status");
const apiUrl = parseStatusValue(status.stdout ?? "", "API_URL");
const publishableKey = parseStatusValue(status.stdout ?? "", "PUBLISHABLE_KEY");

if (!apiUrl.startsWith("http://127.0.0.1:") && !apiUrl.startsWith("http://localhost:")) {
  throw new Error("Local demo mode refuses to use a non-local Supabase project.");
}

requireSuccess(
  runCli(supabaseCli, ["migration", "up", "--local"], { stdio: "inherit" }),
  "Applying local migrations",
);

process.stdout.write("\nConstruction Manager local demo is ready.\n");
process.stdout.write("Open http://localhost:3000/sign-in and choose Open local demo.\n");
process.stdout.write("Your test data will persist locally. Press Ctrl+C to stop the app.\n\n");

const app = spawn(process.execPath, [nextCli, "dev"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    APP_ENV: "development",
    LOCAL_DEMO_MODE: "true",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: apiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    OWNER_EMAIL_ALLOWLIST: localOwnerEmail,
    DEFAULT_CURRENCY: "ZMW",
    PROJECT_TIMEZONE: "Africa/Lusaka",
  },
  stdio: "inherit",
});

app.on("error", (error) => {
  process.stderr.write(`Could not start Next.js: ${error.message}\n`);
  process.exitCode = 1;
});

app.on("exit", (code, signal) => {
  if (signal) process.stdout.write(`Application stopped (${signal}).\n`);
  process.exitCode = code ?? 0;
});
