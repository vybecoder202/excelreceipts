import { expect, test } from "@playwright/test";

test("foundation dashboard exposes safe empty state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Project overview" })).toBeVisible();
  await expect(page.getByText("No project data connected")).toBeVisible();
  await expect(page.getByRole("link", { name: "Set up project" })).toBeVisible();
});

test("mobile layout keeps primary navigation reachable", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile project only");
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary mobile navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Inventory" }).last()).toBeVisible();
});
