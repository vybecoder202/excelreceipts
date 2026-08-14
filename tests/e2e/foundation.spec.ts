import { expect, test } from "@playwright/test";

test("workspace exposes a safe project-required data state", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/data$/);
  await expect(page.getByRole("heading", { name: "Data" })).toBeVisible();
  await expect(page.getByText("Project required")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open project setup" })).toBeVisible();
});

test("mobile layout keeps primary navigation reachable", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile project only");
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Workspace sections" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Data" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Interfaces" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forms" })).toBeVisible();
});

test("project setup presents confirmed owner decisions without exposing private identity", async ({
  page,
}) => {
  await page.goto("/setup");
  await expect(page.getByRole("heading", { name: "Project setup" })).toBeVisible();
  await expect(page.getByText("Zambian Kwacha (ZMW)")).toBeVisible();
  await expect(page.getByText("Africa/Lusaka")).toBeVisible();
  await expect(page.getByText("Excluded from scope").first()).toBeVisible();
  await expect(page.getByText(/owner email is intentionally not collected/i)).toBeVisible();
});

test("sign-in screen explains the safe unconfigured state", async ({ page }) => {
  await page.goto("/sign-in?next=/setup");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
  await expect(page.getByText(/after the development Supabase project is configured/i)).toBeVisible();
});

test("site planning route shows a truthful project-required state", async ({ page }) => {
  await page.goto("/site");
  await expect(page.getByRole("heading", { name: "Site & progress" })).toBeVisible();
  await expect(page.getByText("Project required")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open project setup" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
