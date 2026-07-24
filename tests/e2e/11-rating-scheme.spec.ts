import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

test.describe("Rating Scheme visibility and authority", () => {
  test("CPT Smith sees the full immediate-unit scheme without management controls", async ({ page }) => {
    await loginAs(page, USERS.commander);
    await page.goto("/rating-scheme");
    await expect(page.getByText("Loading rating scheme...")).toHaveCount(0, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Rating Scheme" })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Rated personnel")).toBeVisible();
    await expect(page.getByText("Complete assignments")).toBeVisible();
    await expect(page.getByText("Missing assignments")).toBeVisible();
    await expect(page.getByText("Assignment Exceptions")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy current scheme" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add assignment" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Submit for approval" })).toHaveCount(0);
    await expect(page.getByRole("row", { name: /SGT Davis, James/ }).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /SSG Johnson, Marcus/ }).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /SFC Williams, Robert/ }).first()).toBeVisible();
  });

  test("LTC Reed sees the Battalion Commander draft action", async ({ page }) => {
    await loginAs(page, USERS.battalionCommander);
    await page.goto("/rating-scheme");
    await expect(page.getByText("Loading rating scheme...")).toHaveCount(0, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Rating Scheme" })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("button", { name: "Copy current scheme" })).toBeVisible();
  });

  test("a non-command user sees only their own rating chain", async ({ page }) => {
    await loginAs(page, USERS.soldier);
    await page.goto("/rating-scheme");
    await expect(page.getByText("Loading rating scheme...")).toHaveCount(0, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "My Rating Chain" })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("tab", { name: "My relationships" })).toBeVisible();
    await expect(page.getByText("Rated personnel")).toHaveCount(0);
    await expect(page.getByText("Assignment Exceptions")).toHaveCount(0);
    await expect(page.getByText("SGT Davis, James").first()).toBeVisible();
    await expect(page.getByText("SSG Johnson, Marcus")).toBeVisible();
    await expect(page.getByText("1LT Torres, Maria")).toHaveCount(0);
  });
});