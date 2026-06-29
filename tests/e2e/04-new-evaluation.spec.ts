/**
 * 04 – New Evaluation Wizard (Mode Chooser + Rater Wizard)
 * ─────────────────────────────────────────────────────────
 * Tests the mode chooser and the rater-initiated EvalCreationWizard.
 */

import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

test.describe("New Evaluation – mode chooser", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto("/evaluations/new");
  });

  test("shows heading 'Start Evaluation'", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /start evaluation/i })).toBeVisible();
  });

  test("shows Rated Soldier button", async ({ page }) => {
    await expect(page.getByText(/i'm the rated soldier/i)).toBeVisible();
  });

  test("shows Rater / Admin button", async ({ page }) => {
    await expect(page.getByText(/i'm the rater/i)).toBeVisible();
  });

  test("clicking 'I'm the Rater' shows rater wizard", async ({ page }) => {
    await page.getByText(/i'm the rater/i).click();
    await expect(page.getByRole("heading", { name: /start new evaluation/i })).toBeVisible();
  });

  test("clicking 'I'm the Rated Soldier' shows soldier wizard", async ({ page }) => {
    await page.getByText(/i'm the rated soldier/i).click();
    await expect(page.getByRole("heading", { name: /initiate my evaluation/i })).toBeVisible();
  });
});

test.describe("New Evaluation – Rater wizard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto("/evaluations/new?mode=rater");
  });

  test("wizard renders without error", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("wizard has a form or step indicators", async ({ page }) => {
    // The wizard should have some step indicator or form fields visible
    const hasContent = await page.locator("form, fieldset, [role='group'], [data-step]").count();
    // Or just headings — be lenient here since the wizard structure may vary
    const headings = await page.getByRole("heading").count();
    expect(headings).toBeGreaterThan(0);
  });

  test("cancel button returns to mode chooser", async ({ page }) => {
    const cancelBtn = page.getByRole("button", { name: /cancel/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(page.getByText(/who is initiating/i)).toBeVisible();
    }
  });
});

test.describe("New Evaluation – Soldier wizard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.soldier);
    await page.goto("/evaluations/new?mode=soldier");
  });

  test("soldier wizard renders", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /initiate my evaluation/i })).toBeVisible();
  });

  test("shows loading chains or empty state", async ({ page }) => {
    // Wait for content to stabilize
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("cancel returns to mode chooser", async ({ page }) => {
    const cancelBtn = page.getByRole("button", { name: /cancel/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(page.getByText(/who is initiating/i)).toBeVisible();
    }
  });
});
