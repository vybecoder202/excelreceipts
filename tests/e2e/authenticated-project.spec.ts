import { expect, test } from "@playwright/test";

test("local owner builds and uses a linked construction workspace", async ({ page }) => {
  test.setTimeout(120_000);
  page.setDefaultTimeout(15_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Open local demo" }).click();

  await page.goto("/setup");
  await page.getByLabel(/Project name/).fill("Local configurable house build");
  await page.getByLabel(/Short description/).fill("Builder workflow test");
  await page.getByRole("button", { name: "Create secure project" }).click();
  await expect(page).toHaveURL(/\/data/);

  await page.getByRole("button", { name: "Install construction starter" }).click();
  await expect(page).toHaveURL(/\/data\/[0-9a-f-]+/);
  await expect(page.getByRole("heading", { name: "Phases" })).toBeVisible();

  await page.getByRole("link", { name: "Suppliers" }).click();
  await page.getByRole("link", { name: "New record" }).click();
  await page.getByLabel("Supplier", { exact: true }).fill("Lusaka Cement Supplies");
  await page.getByLabel("Contact name").fill("Chanda Mwila");
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByText("Lusaka Cement Supplies").first()).toBeVisible();

  await page.getByRole("link", { name: "Expenses" }).click();
  await page.getByRole("link", { name: "New record" }).click();
  await page.getByLabel("Description", { exact: true }).fill("Foundation excavation deposit");
  await page.getByLabel("Amount").fill("3500.00");
  await page.getByLabel("Expense date").fill("2026-08-14");
  await page.getByLabel("Lusaka Cement Supplies").check();
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByText("Foundation excavation deposit").first()).toBeVisible();
  await expect(page.getByText("Lusaka Cement Supplies").first()).toBeVisible();

  await page.getByRole("link", { name: "Forms" }).click();
  await page.getByRole("link", { name: /Daily site log/ }).click();
  await expect(page.getByRole("heading", { name: "Daily site log" })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("link", { name: "Interfaces" }).click();
  await page.getByRole("link", { name: /Construction overview/ }).click();
  await expect(page.getByText("Total expenses")).toBeVisible();
  await expect(page.getByText(/3,500\.00/)).toBeVisible();
});
