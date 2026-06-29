/**
 * EES 2.0 – Page Object Models
 * Thin wrappers so tests stay readable.
 */

import type { Page, Locator } from "@playwright/test";

// ──────────────────────────────────────────────
// Sidebar
// ──────────────────────────────────────────────
export class SidebarPOM {
  readonly dashboard: Locator;
  readonly myEval: Locator;
  readonly mySoldiers: Locator;
  readonly supportForm: Locator;
  readonly allEvaluations: Locator;
  readonly analytics: Locator;
  readonly admin: Locator;

  constructor(page: Page) {
    this.dashboard = page.getByRole("link", { name: /^dashboard$/i });
    this.myEval = page.getByRole("link", { name: /^my eval$/i });
    this.mySoldiers = page.getByRole("link", { name: /^my soldiers$/i });
    this.supportForm = page.getByRole("link", { name: /^support form$/i });
    this.allEvaluations = page.getByRole("link", { name: /^all evaluations$/i });
    this.analytics = page.getByRole("link", { name: /^analytics$/i });
    this.admin = page.getByRole("link", { name: /^admin$/i });
  }
}

// ──────────────────────────────────────────────
// Evaluations List Page
// ──────────────────────────────────────────────
export class EvaluationsListPOM {
  readonly page: Page;
  readonly startButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startButton = page.getByRole("button", { name: /start ncoer/i }).or(
      page.getByRole("link", { name: /start ncoer/i })
    );
  }

  evalCards() {
    return this.page.locator("a[href^='/evaluations/']").filter({ hasNot: this.page.locator("[href='/evaluations/new']") });
  }
}

// ──────────────────────────────────────────────
// New Evaluation Mode Chooser
// ──────────────────────────────────────────────
export class NewEvalPOM {
  readonly soldierBtn: Locator;
  readonly raterBtn: Locator;

  constructor(page: Page) {
    this.soldierBtn = page.getByText(/i'm the rated soldier/i);
    this.raterBtn = page.getByText(/i'm the rater/i);
  }
}

// ──────────────────────────────────────────────
// Evaluation Admin / Overview tab
// ──────────────────────────────────────────────
export class EvalAdminPOM {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  sectionLink(sectionName: string) {
    return this.page.getByRole("link", { name: new RegExp(sectionName, "i") });
  }
}

// ──────────────────────────────────────────────
// Section Editor
// ──────────────────────────────────────────────
export class SectionEditorPOM {
  readonly page: Page;
  readonly addBulletBtn: Locator;
  readonly markCompleteBtn: Locator;
  readonly aiToggleBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addBulletBtn = page.getByRole("button", { name: /add bullet/i });
    this.markCompleteBtn = page.getByRole("button", { name: /mark (section )?complete/i });
    this.aiToggleBtn = page.getByRole("button", { name: /ai suggestions/i });
  }

  bulletInputs() {
    return this.page.locator("textarea[placeholder*='bullet'], input[placeholder*='bullet']");
  }
}

// ──────────────────────────────────────────────
// Sign Page
// ──────────────────────────────────────────────
export class SignPagePOM {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  signButton(role: string) {
    return this.page.getByRole("button", { name: new RegExp(`sign as ${role}`, "i") });
  }

  declineButton(role: string) {
    return this.page.getByRole("button", { name: new RegExp(`decline`, "i") }).first();
  }

  statusBadge(role: string) {
    return this.page.getByText(new RegExp(role, "i")).locator("..");
  }
}
