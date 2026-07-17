import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

test.describe("Performance Timeline milestones", () => {
  test("explains milestone status and ownership", async ({ page }) => {
    await loginAs(page, USERS.rater);
    await page.goto("/evaluations/dashboard-eval-johnson-current/timeline");

    await expect(page.getByRole("heading", { name: "Performance Timeline" })).toBeVisible();
    await expect(page.getByText("Milestones")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Due within 7 days")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Overdue status updates automatically")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTitle(/Initial counseling: due .* Owner: Rater/)).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTitle(/Senior rater section: due .* Owner: Senior Rater/)).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTitle(/Soldier acknowledgment: due .* Owner: Rated Soldier/)).toBeVisible({ timeout: 45_000 });
  });
});