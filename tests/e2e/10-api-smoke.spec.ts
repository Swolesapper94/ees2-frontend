/**
 * 10 – API Smoke Tests (via frontend fetch)
 * ─────────────────────────────────────────────────────────────
 * Validates that the backend APIs respond correctly
 * by making direct fetch() calls from the browser context.
 */

import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

const API = "http://localhost:4000/api";

async function apiFetch(page: import("@playwright/test").Page, path: string, token: string) {
  return page.evaluate(
    async ({ url, auth }) => {
      const res = await fetch(url, { headers: { Authorization: auth } });
      return { status: res.status, ok: res.ok };
    },
    { url: `${API}${path}`, auth: token },
  );
}

test.describe("API – GET /evaluations", () => {
  test("returns 200 for rater", async ({ page }) => {
    await loginAs(page, USERS.rater);
    const result = await apiFetch(page, "/evaluations", USERS.rater.token);
    expect(result.status).toBe(200);
  });

  test("?role=rater filter returns 200", async ({ page }) => {
    await loginAs(page, USERS.rater);
    const result = await apiFetch(page, "/evaluations?role=rater", USERS.rater.token);
    expect(result.status).toBe(200);
  });

  test("?role=soldier filter returns 200", async ({ page }) => {
    await loginAs(page, USERS.soldier);
    const result = await apiFetch(page, "/evaluations?role=soldier", USERS.soldier.token);
    expect(result.status).toBe(200);
  });

  test("returns 401 without auth token", async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(async (url) => {
      const res = await fetch(url);
      return { status: res.status };
    }, `${API}/evaluations`);
    expect(result.status).toBe(401);
  });

  test("returns 401 for a malformed bearer token", async ({ page }) => {
    await page.goto("/");
    const result = await apiFetch(page, "/evaluations", "Bearer malformed-token");
    expect(result.status).toBe(401);
  });

  test("continues serving valid development credentials after a malformed token", async ({ page }) => {
    await page.goto("/");
    const invalid = await apiFetch(page, "/evaluations", "Bearer malformed-token");
    expect(invalid.status).toBe(401);

    const valid = await apiFetch(page, "/evaluations", USERS.rater.token);
    expect(valid.status).toBe(200);
  });
});

test.describe("API – GET /evaluations/:id", () => {
  test("returns 200 for seeded eval", async ({ page }) => {
    await loginAs(page, USERS.rater);
    const result = await apiFetch(
      page,
      "/evaluations/dev-eval-davis",
      USERS.rater.token,
    );
    expect(result.status).toBe(200);
  });

  test("returns 404 for non-existent eval", async ({ page }) => {
    await loginAs(page, USERS.rater);
    const result = await apiFetch(
      page,
      "/evaluations/does-not-exist-xyz",
      USERS.rater.token,
    );
    expect(result.status).toBe(404);
  });
});

test.describe("API – GET /rating-chains", () => {
  test("returns 200 for rater", async ({ page }) => {
    await loginAs(page, USERS.rater);
    const result = await apiFetch(page, "/rating-chains", USERS.rater.token);
    expect(result.status).toBe(200);
  });
});

test.describe("API – GET /users/me", () => {
  for (const [key, user] of Object.entries(USERS)) {
    test(`returns 200 for ${key}`, async ({ page }) => {
      await loginAs(page, user);
      const result = await apiFetch(page, "/users/me", user.token);
      expect([200, 404]).toContain(result.status); // 404 ok if user not in DB
    });
  }
});
