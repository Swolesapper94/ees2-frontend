/**
 * 08 – Admin Pages
 * ─────────────────────────────────────────────
 * Tests /admin/users, /admin/units, /admin/rating-chains pages.
 */

import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

test.describe("Admin – legacy Users redirect", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.admin);
    await page.goto("/admin/users");
  });

  test("redirects to Identity and Access Administration", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin\/identity-access/);
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
