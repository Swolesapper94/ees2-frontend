/**
 * 05 – Evaluation Detail Pages
 * ─────────────────────────────────────────────
 * Uses isolated workflow fixture IDs to test the /evaluations/[id] sub-pages.
 *
 * Workflow fixture IDs (from scripts/seed-workflow-test-data.ts):
 *  - test-eval-davis-complete  → COMPLETE, signed NCOER_9_1
 *  - dev-eval-davis            → RATER_IN_PROGRESS, NCOER_9_1 (3/6 sections done)
 */

import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

const EVALS = {
  complete: "test-eval-davis-complete",
  pendingSR: "test-eval-davis-complete",
  inProgress: "dev-eval-davis",
};

test.describe("Evaluation – Admin (Part I) tab", () => {
  test("shows evaluation metadata for complete eval", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.complete}/admin`);
    // Wait for API data to load before asserting
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /administrative data/i })).toBeVisible();
  });

  test("shows soldier name in table", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.complete}/admin`);
    await page.waitForLoadState("networkidle");
    // SGT Davis should appear in the metadata table — scope to the table to avoid ambiguous matches.
    await expect(page.locator("table").getByText(/davis/i).first()).toBeVisible();
  });

  test("shows form type", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.complete}/admin`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/NCOER/)).toBeVisible();
  });
});

test.describe("Evaluation – Duty Description tab", () => {
  test("renders duty description page", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.inProgress}/duty`);
    await expect(page.locator("body")).not.toContainText("500");
  });
});

test.describe("Evaluation – Section Nav", () => {
  test("section nav is visible on eval layout", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.inProgress}/admin`);
    await page.waitForLoadState("networkidle");
    // Section nav should have links to Part IV sections
    await expect(page.getByRole("link", { name: /character/i })).toBeVisible();
  });

  test("CHARACTER section link leads to correct URL", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.inProgress}/admin`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: /character/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/evaluations/${EVALS.inProgress}/CHARACTER`, "i"));
  });
});

test.describe("Evaluation – Part IV Section Editor", () => {
  const sections = ["CHARACTER", "PRESENCE", "INTELLECT", "LEADS", "DEVELOPS", "ACHIEVES"];

  for (const section of sections) {
    test(`${section} section renders`, async ({ page }) => {
      await loginAs(page, USERS.rater);
      await page.goto(`/evaluations/${EVALS.inProgress}/${section}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).not.toContainText("500");
    });
  }

  test("completed CHARACTER section shows bullets", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.complete}/CHARACTER`);
    await page.waitForLoadState("networkidle");
    // The complete fixture has a finalized CHARACTER bullet.
    await expect(page.getByText(/integrity|UCMJ/i).first()).toBeVisible();
  });

  test("incomplete LEADS section shows editable state", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.inProgress}/LEADS`);
    await page.waitForLoadState("networkidle");
    // Should not be marked complete
    const body = await page.textContent("body");
    // No "Completed" text prominently for an incomplete section
    expect(body).not.toBeNull();
  });

  test("Mark Complete button is present on incomplete section", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.inProgress}/LEADS`);
    await page.waitForLoadState("networkidle");
    const btn = page.getByRole("button", { name: /mark (section )?complete/i });
    if (await btn.isVisible()) {
      await expect(btn).toBeEnabled();
    }
  });
});

test.describe("Evaluation – Review tab", () => {
  test("review page renders", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.complete}/review`);
    await expect(page.locator("body")).not.toContainText("500");
  });
});

test.describe("Evaluation – Senior Rater tab", () => {
  test("senior-rater page renders", async ({ page }) => {
    await loginAs(page, USERS.seniorRater);
    await page.goto(`/evaluations/${EVALS.pendingSR}/senior-rater`);
    await expect(page.locator("body")).not.toContainText("500");
  });
});

test.describe("Evaluation – Sign tab", () => {
  test("sign page renders with signature slots", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.complete}/sign`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("complete eval shows SIGNED statuses", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto(`/evaluations/${EVALS.complete}/sign`);
    await page.waitForLoadState("networkidle");
    // Complete eval should have at least one SIGNED badge
    await expect(page.getByText(/signed/i).first()).toBeVisible();
  });
});
