/**
 * 08 – Admin Pages
 * ─────────────────────────────────────────────
 * Tests /admin/users, /admin/units, /admin/rating-chains pages.
 */

import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

test.describe("Admin – Users page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.admin);
    await page.goto("/admin/users");
  });

  test("renders users heading", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
  });

  test("does not throw 500", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });
});

test.describe("Admin – Units page", () => {
  test("renders units page", async ({ page }) => {
    await loginAs(page, USERS.admin);
    await page.goto("/admin/units");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });
});

test.describe("Admin – Rating Chains page", () => {
  test("renders rating chains page", async ({ page }) => {
    await loginAs(page, USERS.admin);
    await page.goto("/admin/rating-chains");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });
});

test.describe("Analytics page", () => {
  test("renders analytics page for commander", async ({ page }) => {
    await loginAs(page, USERS.commander);
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });
});
