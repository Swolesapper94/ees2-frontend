/**
 * 06 – Support Form Page
 * ─────────────────────────────────────────────
 * Tests the support form entry log page and quick-entry bar.
 */

import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

test.describe("Support Form – list page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.soldier);
    await page.goto("/support-form");
  });

  test("shows heading 'Support Form'", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /support form/i })).toBeVisible();
  });

  test("has 'Log entry' button", async ({ page }) => {
    await expect(page.getByRole("link", { name: /log entry/i })).toBeVisible();
  });

  test("Log entry button navigates to /support-form/entry/new", async ({ page }) => {
    await page.getByRole("link", { name: /log entry/i }).click();
    await expect(page).toHaveURL(/\/support-form\/entry\/new/);
  });

  test("page does not error", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("500");
  });
});

test.describe("Support Form – new entry page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.soldier);
    await page.goto("/support-form/entry/new");
  });

  test("renders entry form or heading", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("form has section selector or text area", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const hasForm = await page.locator("form, textarea, select, [role='listbox']").count();
    expect(hasForm).toBeGreaterThan(0);
  });
});
