/**
 * 02 – Dashboard
 * ─────────────────────────────────────────────
 * Tests the main dashboard content for each persona type.
 */

import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

test.describe("Dashboard – Soldier persona", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.soldier);
  });

  test("shows page title", async ({ page }) => {
    // The h1 is rendered in both loading and loaded states
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("does not error (no 500 text)", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });
});

test.describe("Dashboard – Rater persona", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.rater);
  });

  test("dashboard renders without error", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });
});

test.describe("Dashboard – Commander persona", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.commander);
  });

  test("dashboard renders for commander", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("500");
  });
});
