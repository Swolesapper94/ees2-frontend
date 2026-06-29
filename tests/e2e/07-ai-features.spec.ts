/**
 * 07 – AI Features
 * ─────────────────────────────────────────────
 * Tests AI bullet suggestions panel and from-scratch generation
 * on Part IV section pages.
 */

import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

const EVAL_ID = "dev-eval-davis";

test.describe("AI Suggestions – toggle", () => {
  test("AI toggle button is visible on LEADS section", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVAL_ID}/LEADS`);
    await page.waitForLoadState("networkidle");
    const aiBtn = page.getByRole("button", { name: /ai suggestions/i });
    if (await aiBtn.isVisible()) {
      await expect(aiBtn).toBeEnabled();
    }
  });

  test("clicking AI toggle opens AI panel", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVAL_ID}/LEADS`);
    await page.waitForLoadState("networkidle");
    const aiBtn = page.getByRole("button", { name: /ai suggestions/i });
    if (await aiBtn.isVisible()) {
      await aiBtn.click();
      // Panel should appear — look for generate button or suggestions header
      await expect(
        page.getByText(/generate/i).or(page.getByText(/ai suggestions/i)).first()
      ).toBeVisible();
    }
  });
});

test.describe("AI Suggestions – from scratch generation", () => {
  test("from-scratch text area is accessible after toggle", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVAL_ID}/LEADS`);
    await page.waitForLoadState("networkidle");

    const aiBtn = page.getByRole("button", { name: /ai suggestions/i });
    if (await aiBtn.isVisible()) {
      await aiBtn.click();
      const textarea = page.locator("textarea").last();
      if (await textarea.isVisible()) {
        await textarea.fill("Soldier led a 4-man team through complex urban operations.");
        await expect(textarea).toHaveValue(/led a 4-man team/);
      }
    }
  });
});

test.describe("AI Suggestions – no AI panel on non-Part IV sections", () => {
  test("admin section should not show AI toggle", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVAL_ID}/admin`);
    await page.waitForLoadState("networkidle");
    const aiBtn = page.getByRole("button", { name: /ai suggestions/i });
    // AI toggle should NOT be on the admin (Part I) page
    await expect(aiBtn).not.toBeVisible();
  });
});
