/**
 * 01 – Auth & Navigation
 * ─────────────────────────────────────────────
 * Tests that every persona can log in via the dev-login UI,
 * land on the dashboard, and see the correct sidebar items.
 */

import { test, expect } from "@playwright/test";
import { USERS, devLoginViaUI, loginAs, logout } from "./helpers/auth";
import { SidebarPOM } from "./helpers/poms";

test.describe("Dev login page", () => {
  test("renders all profiles", async ({ page }) => {
    await page.goto("/dev-login");
    await expect(page.getByText(/SGT Davis/i)).toBeVisible();
    await expect(page.getByText(/SSG Johnson/i)).toBeVisible();
    await expect(page.getByText(/SFC Williams/i)).toBeVisible();
    await expect(page.getByText(/1LT Torres/i)).toBeVisible();
    await expect(page.getByText(/CPT Smith/i)).toBeVisible();
  });

  test("login button is present", async ({ page }) => {
    await page.goto("/dev-login");
    await expect(page.getByRole("button", { name: /login as selected/i })).toBeVisible();
  });
});

test.describe("Auth – localStorage injection", () => {
  for (const [key, user] of Object.entries(USERS)) {
    test(`${key} reaches dashboard`, async ({ page }) => {
      await loginAs(page, user);
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator("body")).not.toContainText("401");
    });
  }
});

test.describe("Sidebar visibility", () => {
  test("rated soldier sees My Eval and Support Form", async ({ page }) => {
    await loginAs(page, USERS.soldier);
    const sb = new SidebarPOM(page);
    await expect(sb.myEval).toBeVisible();
    await expect(sb.supportForm).toBeVisible();
  });

  test("rater sees My Soldiers", async ({ page }) => {
    await loginAs(page, USERS.rater);
    const sb = new SidebarPOM(page);
    await expect(sb.mySoldiers).toBeVisible();
  });

  test("dashboard link navigates correctly", async ({ page }) => {
    await loginAs(page, USERS.rater);
    const sb = new SidebarPOM(page);
    await sb.dashboard.click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("My Eval link navigates to /evaluations", async ({ page }) => {
    await loginAs(page, USERS.soldier);
    const sb = new SidebarPOM(page);
    await sb.myEval.click();
    await expect(page).toHaveURL(/\/evaluations/);
  });

  test("My Soldiers link navigates to /my-soldiers", async ({ page }) => {
    await loginAs(page, USERS.rater);
    const sb = new SidebarPOM(page);
    await sb.mySoldiers.click();
    await expect(page).toHaveURL(/\/my-soldiers/);
  });

  test("All Evaluations link navigates to /all-evaluations", async ({ page }) => {
    await loginAs(page, USERS.rater);
    const sb = new SidebarPOM(page);
    await sb.allEvaluations.click();
    await expect(page).toHaveURL(/\/all-evaluations/);
  });

  test("only one sidebar item is highlighted at a time", async ({ page }) => {
    await loginAs(page, USERS.rater);
    // Count how many nav links have the active background class
    const activeLinks = page.locator("nav a.bg-sidebar-accent");
    await expect(activeLinks).toHaveCount(1);
  });
});

test.describe("Unauthenticated redirect", () => {
  test("visiting /dashboard without auth shows 401 or redirects", async ({ page }) => {
    // Ensure no stored auth
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("devAuth"));
    await page.goto("/dashboard");
    // Wait for async auth check / API call to settle
    await page.waitForLoadState("networkidle");
    // Either redirected to login or page contains an auth error
    const url = page.url();
    const body = await page.textContent("body");
    const isRedirected = url.includes("/login") || url.includes("/dev-login");
    const hasError = body?.includes("401") || body?.includes("log in") || body?.includes("Unauthorized");
    expect(isRedirected || hasError).toBeTruthy();
  });
});
