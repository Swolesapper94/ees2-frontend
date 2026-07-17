/**
 * EES 2.0 Test Helpers
 * ─────────────────────
 * Dev personas that map to backend DEV_USERS in auth.ts.
 * Token format: `dev:<email>:testpass` stored in localStorage as `devAuth`.
 */

import type { Page } from "@playwright/test";

export const USERS = {
  /** SGT Davis – Rated soldier only, NCOER 9-1 */
  soldier: {
    email: "james.davis@army.mil",
    label: "SGT Davis — Team Leader",
    token: "Bearer dev:james.davis@army.mil:testpass",
  },
  /** SSG Johnson – Rated soldier + Rater, NCOER 9-2 */
  rater: {
    email: "marcus.johnson@army.mil",
    label: "SSG Johnson — Squad Leader",
    token: "Bearer dev:marcus.johnson@army.mil:testpass",
  },
  /** SFC Williams – Soldier + Rater + Senior Rater */
  seniorRater: {
    email: "robert.williams@army.mil",
    label: "SFC Williams — Platoon Sergeant",
    token: "Bearer dev:robert.williams@army.mil:testpass",
  },
  /** 1LT Torres – Rater who triggers supplementary review requirement */
  suppRater: {
    email: "maria.torres@army.mil",
    label: "1LT Torres — PLT Leader",
    token: "Bearer dev:maria.torres@army.mil:testpass",
  },
  /** CPT Smith – Commander, all roles */
  commander: {
    email: "peter.smith@army.mil",
    label: "CPT Smith — Company Commander",
    token: "Bearer dev:peter.smith@army.mil:testpass",
  },
  /** LTC Reed – the active Battalion Commander and rating-scheme authority. */
  battalionCommander: {
    email: "morgan.reed@army.mil",
    label: "LTC Reed — Battalion Commander",
    token: "Bearer dev:morgan.reed@army.mil:testpass",
  },
  /** CPT Avery Quinn – application administrator */
  admin: {
    email: "avery.quinn@army.mil",
    label: "CPT Quinn — Servicing Administrator",
    token: "Bearer dev:avery.quinn@army.mil:testpass",
  },
} as const;

export type UserKey = keyof typeof USERS;

/**
 * Injects dev auth credentials into localStorage so every subsequent
 * API call is authenticated as the given persona.
 */
export async function loginAs(page: Page, user: (typeof USERS)[UserKey]) {
  // Navigate to base URL first so localStorage is available
  await page.goto("/");
  await page.evaluate((token) => {
    localStorage.setItem("devAuth", token);
  }, user.token);
  // Navigate to dashboard to confirm auth took effect
  await page.goto("/dashboard");
}

/** Clears dev auth from localStorage (logout). */
export async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("devAuth");
    localStorage.removeItem("devProfileEmail");
  });
}

/** Selects a profile on the /dev-login page and clicks Login. */
export async function devLoginViaUI(page: Page, user: (typeof USERS)[UserKey]) {
  await page.goto("/dev-login");
  await page.getByText(user.label).click();
  await page.getByRole("button", { name: /login as selected/i }).click();
  await page.waitForURL("**/dashboard");
}
