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

  test("shows IPPS-A demo profile, Microsoft avatar source, and assignment rating chain", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Current Army Profile" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /good .* sgt davis/i })).toBeVisible();
    await expect(page.getByLabel("Dashboard greeting").getByText("Team Leader · 721st Engineer Company")).toBeVisible();
    await expect(page.getByText("Personnel information is maintained by the authoritative source system.")).toBeVisible();
    await expect(page.getByText("IPPS-A").first()).toBeVisible();
    await expect(page.getByText(/demo stub/i).first()).toBeVisible();
    await expect(page.getByText("CURRENT").first()).toBeVisible();
    await expect(page.getByText("W8A0AA")).toBeVisible();
    await expect(page.getByText(/PASS.*523|523.*PASS/)).toBeVisible();
    await expect(page.getByText("SSG Johnson, M.")).toBeVisible();
    await expect(page.getByText("SFC Williams, R.")).toBeVisible();
    await expect(page.getByLabel("Dashboard greeting").getByRole("img", { name: /SGT James Davis profile avatar/i })).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    await expect(page.getByRole("banner").getByText("Profile photo source: Microsoft 365 - demo stub")).toBeVisible();
  });

  test("falls back to initials when the demo avatar is missing", async ({ page }) => {
    await page.route("**/demo-avatars/james-davis.webp", (route) => route.abort());
    await page.route("**/_next/image**james-davis.webp**", (route) => route.abort());
    await page.reload();
    await expect(page.getByRole("heading", { name: "Current Army Profile" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("JD").first()).toBeVisible();
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
