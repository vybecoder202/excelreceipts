import { expect, test } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";

const localOwnerEmail = "owner@example.test";
const localOwnerPassword = "local-test-only";

test.beforeEach(async ({ context }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Authenticated E2E requires local Supabase URL and publishable key variables.");
  }

  let authCookies: { name: string; value: string }[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return authCookies;
      },
      setAll(cookies) {
        authCookies = cookies.map(({ name, value }) => ({ name, value }));
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: localOwnerEmail,
    password: localOwnerPassword,
  });
  expect(error).toBeNull();

  await context.addCookies(
    authCookies.map(({ name, value }) => ({
      name,
      value,
      url: "http://127.0.0.1:3001",
    })),
  );
});

test("authenticated owner creates the first project and phase through protected flows", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/setup");

  await expect(page.getByRole("heading", { name: "Create your first project" })).toBeVisible();
  await expect(page.locator("#main-content").getByText(localOwnerEmail)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const createButton = page.getByRole("button", { name: "Create secure project" });
  expect((await createButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await createButton.click();
  await expect(page.getByText("Review the highlighted fields and try again.")).toBeVisible();
  await expect(page.getByLabel(/Project name/)).toHaveAttribute("aria-invalid", "true");

  await page.getByLabel(/Project name/).fill("Local authenticated house build");
  await page.getByLabel(/Short description/).fill("End-to-end security workflow");
  await createButton.click();

  await expect(page).toHaveURL(/\/?created=1$/);
  await expect(page.getByText("Project created securely")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Local authenticated house build" })).toBeVisible();
  await expect(page.getByText("Project connected")).toBeVisible();

  await page.goto("/site");
  await expect(page.getByRole("heading", { name: "Site & progress" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No phases yet" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const createPhaseButton = page.getByRole("button", { name: "Create phase" });
  expect((await createPhaseButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await createPhaseButton.click();
  await expect(page.getByText("Review the highlighted phase details and try again.")).toBeVisible();

  await page.getByLabel(/Phase name/).fill("Substructure");
  await page.getByLabel("Description").fill("Foundations and ground works");
  await page.getByLabel("Planned start").fill("2026-08-17");
  await page.getByLabel("Planned end").fill("2026-09-18");
  await createPhaseButton.click();

  await expect(page).toHaveURL(/\/site\?created=phase$/);
  await expect(page.getByText("Phase created", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Substructure" })).toBeVisible();
  await expect(page.getByText("PH-2026-0001")).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
