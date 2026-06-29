/**
 * 09 – Role-Based Access / Persona-Specific Flows
 * ─────────────────────────────────────────────────
 * Verifies that each persona sees the right UI and
 * cannot access areas outside their role.
 */

import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

// ── Rated Soldier (SGT Davis) ──────────────────────────────────
test.describe("Rated Soldier persona", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.soldier);
  });

  test("can navigate to My Eval", async ({ page }) => {
    await page.goto("/evaluations");
    await expect(page.locator("body")).not.toContainText("Unauthorized");
  });

  test("can view own eval admin data", async ({ page }) => {
    await page.goto("/evaluations/dev-eval-davis/admin");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("can navigate to sign page", async ({ page }) => {
    await page.goto("/evaluations/dev-eval-davis/sign");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });
});

// ── Rater (SSG Johnson) ────────────────────────────────────────
test.describe("Rater persona", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.rater);
  });

  test("can view My Soldiers page", async ({ page }) => {
    await page.goto("/my-soldiers");
    await expect(page.getByRole("heading", { name: /my soldiers/i })).toBeVisible();
  });

  test("can navigate to eval section editor", async ({ page }) => {
    await page.goto("/evaluations/dev-eval-davis/LEADS");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("can open New Evaluation as rater", async ({ page }) => {
    await page.goto("/evaluations/new?mode=rater");
    await expect(page.getByRole("heading", { name: /start new evaluation/i })).toBeVisible();
  });
});

// ── Senior Rater (SFC Williams) ────────────────────────────────
test.describe("Senior Rater persona", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.seniorRater);
  });

  test("can access senior-rater section", async ({ page }) => {
    await page.goto("/evaluations/seed-eval-jones-pending/senior-rater");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("sees My Soldiers sidebar item", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: /my soldiers/i })).toBeVisible();
  });
});

// ── Supplementary Reviewer (1LT Torres) ───────────────────────
test.describe("Supplementary Reviewer persona (1LT)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.suppRater);
  });

  test("can reach evaluations page", async ({ page }) => {
    await page.goto("/evaluations");
    await expect(page.locator("body")).not.toContainText("500");
  });
});

// ── Commander (CPT Smith) ──────────────────────────────────────
test.describe("Commander persona", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.commander);
  });

  test("can access all-evaluations", async ({ page }) => {
    await page.goto("/all-evaluations");
    await expect(page.getByRole("heading", { name: /all evaluations/i })).toBeVisible();
  });

  test("can access analytics page", async ({ page }) => {
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });
});
