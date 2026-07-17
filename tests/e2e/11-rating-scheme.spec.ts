import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

test.describe("Rating Scheme visibility and authority", () => {
  test("CPT Smith sees the full immediate-unit scheme without management controls", async ({ page }) => {
    await loginAs(page, USERS.commander);
    await page.goto("/rating-scheme");
    await expect(page.getByText("Loading rating scheme...")).toHaveCount(0, { timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Rating Scheme" })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Rated personnel")).toBeVisible();
    await expect(page.getByText("10", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("ASSIGNMENT MISSING")).toHaveCount(7);
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
});