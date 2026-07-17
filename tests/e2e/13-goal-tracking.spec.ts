import { test, expect } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

const API = "http://localhost:4000/api";

async function apiFetch(page: import("@playwright/test").Page, path: string, token: string, init: RequestInit = {}) {
  return page.evaluate(async ({ url, auth, init }) => {
    const response = await fetch(url, { ...init, headers: { Authorization: auth, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    return { status: response.status, body: await response.json().catch(() => null) };
  }, { url: `${API}${path}`, auth: token, init });
}

test.describe("Goal tracking privacy and progress", () => {
  test("shows rater lifecycle controls in the Goal workspace", async ({ page }) => {
    test.setTimeout(60_000);
    await loginAs(page, USERS.rater);
    await page.goto("/support-form/goals?formId=test-sf-davis-1783951336663");

    await expect(page.getByRole("heading", { name: "Goals and Progress" })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("button", { name: "Record rater assessment" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Record counseling progress" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Manage evidence" }).first()).toBeVisible();
  });

  test("keeps documentation signals out of the Soldier view while allowing rater progress review", async ({ page }) => {
    await loginAs(page, USERS.soldier);
    const forms = await apiFetch(page, "/support-forms?soldierId=dev-sgt-davis", USERS.soldier.token);
    expect(forms.status).toBe(200);
    const form = (forms.body as { id: string; isActive: boolean; status: string }[]).find((item) => item.id === "test-sf-davis-1783951336663");
    expect(form).toBeTruthy();

    const goalList = await apiFetch(page, `/support-forms/${form!.id}/goals`, USERS.soldier.token);
    expect(goalList.status).toBe(200);
    const goal = (goalList.body as { id: string }[])[0];
    expect(goal).toBeTruthy();

    const soldierSignals = await apiFetch(page, `/support-forms/${form!.id}/documentation-signals`, USERS.soldier.token);
    expect(soldierSignals.status).toBe(403);

    await loginAs(page, USERS.rater);
    const raterSignals = await apiFetch(page, `/support-forms/${form!.id}/documentation-signals`, USERS.rater.token);
    expect(raterSignals.status).toBe(200);
    expect(raterSignals.body).not.toHaveProperty("raterAssessment");
    expect(raterSignals.body).not.toHaveProperty("soldierAssessment");

    const progress = await apiFetch(page, `/support-forms/${form!.id}/goals/${goal.id}/progress`, USERS.rater.token);
    expect(progress.status).toBe(200);
    expect(progress.body).toHaveProperty("progressTrend");
  });

  test("carries an in-progress goal into a same-Soldier next-period support form", async ({ page }) => {
    await loginAs(page, USERS.soldier);
    const sourceFormId = "test-sf-davis-1783951336663";
    const forms = await apiFetch(page, "/support-forms?soldierId=dev-sgt-davis", USERS.soldier.token);
    const targetExists = (forms.body as { id: string; isActive: boolean; status: string }[]).some((form) => form.id === "test-goal-carry-target-2028" && form.isActive && form.status !== "ARCHIVED");
    test.skip(!targetExists, "Requires the isolated carry-forward fixture seeded by scripts/seed-goal-additions-test-data.ts.");
    const goals = await apiFetch(page, `/support-forms/${sourceFormId}/goals`, USERS.soldier.token);
    expect(goals.status).toBe(200);
    const sourceGoal = (goals.body as { id: string; soldierAssessment: string | null; raterAssessment: string | null }[])
      .find((goal) => goal.soldierAssessment === "IN_PROGRESS" || goal.raterAssessment === "IN_PROGRESS" || goal.raterAssessment === "NOT_ACHIEVED");
    expect(sourceGoal).toBeTruthy();

    const carried = await apiFetch(page, `/support-forms/${sourceFormId}/goals/${sourceGoal!.id}/carry-forward`, USERS.soldier.token, {
      method: "POST",
      body: JSON.stringify({ targetSupportFormId: "test-goal-carry-target-2028" }),
    });
    expect(carried.status).toBe(201);
    expect(carried.body).toMatchObject({ supportFormId: "test-goal-carry-target-2028", approvalStatus: "DRAFT", carriedForwardFromGoalId: sourceGoal!.id });
  });
});
