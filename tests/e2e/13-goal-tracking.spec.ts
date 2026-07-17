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

  test("hides rater-only lifecycle controls from the rated Soldier", async ({ page }) => {
    test.setTimeout(60_000);
    await loginAs(page, USERS.soldier);
    await page.goto("/support-form/goals?formId=test-sf-davis-1783951336663");

    await expect(page.getByRole("heading", { name: "Goals and Progress" })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("button", { name: "Record rater assessment" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Record counseling progress" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Review goal" })).toHaveCount(0);
  });

  test("lets the rated Soldier set category and target date for a draft goal", async ({ page }) => {
    test.setTimeout(60_000);
    await loginAs(page, USERS.soldier);
    await page.goto("/support-form/goals?formId=test-sf-davis-1783951336663");

    await expect(page.getByRole("heading", { name: "Draft a goal" })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByLabel("Category")).toBeVisible();
    await expect(page.getByLabel("Target date (optional)")).toBeVisible();
  });

  test("saves edits to the Soldier's draft or revision-requested goal", async ({ page }) => {
    test.setTimeout(60_000);
    await loginAs(page, USERS.soldier);
    const goals = await apiFetch(page, "/support-forms/test-sf-davis-1783951336663/goals", USERS.soldier.token);
    expect(goals.status).toBe(200);
    const editableGoal = (goals.body as { title: string; approvalStatus: string }[])
      .find((goal) => ["DRAFT", "NEEDS_REVISION"].includes(goal.approvalStatus));
    test.skip(!editableGoal, "Requires a Soldier-owned draft or revision-requested Goal fixture.");

    await page.goto("/support-form/goals?formId=test-sf-davis-1783951336663");
    await expect(page.getByRole("button", { name: `Edit ${editableGoal!.title}` })).toBeVisible({ timeout: 45_000 });
    await page.getByRole("button", { name: `Edit ${editableGoal!.title}` }).click();
    const editor = page.getByRole("heading", { name: "Edit goal" }).locator("..");
    const updatedDescription = "Updated through the disposable correction-loop fixture.";
    await editor.getByLabel("Goal and expectation").fill(updatedDescription);
    await editor.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(updatedDescription)).toBeVisible({ timeout: 45_000 });

    const goalCard = page.locator("article").filter({ hasText: editableGoal!.title });
    await goalCard.getByRole("button", { name: "Submit for rater review" }).click();
    await expect(goalCard.getByText("PENDING RATER REVIEW")).toBeVisible({ timeout: 45_000 });

    await loginAs(page, USERS.rater);
    await page.goto("/support-form/goals?formId=test-sf-davis-1783951336663");
    const raterGoalCard = page.locator("article").filter({ hasText: editableGoal!.title });
    await raterGoalCard.getByRole("button", { name: "Review goal" }).click();
    await raterGoalCard.getByRole("button", { name: "Approve goal" }).click();
    await expect(raterGoalCard.getByText("APPROVED")).toBeVisible({ timeout: 45_000 });
  });

  test("lets the rater request revision with guidance", async ({ page }) => {
    test.setTimeout(60_000);
    const title = "Fixture goal for rater revision validation";
    const guidance = "Add the measurable readiness standard before approval.";

    await loginAs(page, USERS.rater);
    await page.goto("/support-form/goals?formId=test-sf-davis-1783951336663");
    const raterGoalCard = page.locator("article").filter({ hasText: title });
    await expect(raterGoalCard.getByRole("button", { name: "Review goal" })).toBeVisible({ timeout: 45_000 });
    await raterGoalCard.getByRole("button", { name: "Review goal" }).click();
    await raterGoalCard.getByRole("button", { name: "Request revision" }).click();
    await raterGoalCard.getByLabel("Revision guidance").fill(guidance);
    await raterGoalCard.getByRole("button", { name: "Send revision request" }).click();
    await expect(raterGoalCard.getByText("NEEDS REVISION")).toBeVisible({ timeout: 45_000 });

    await loginAs(page, USERS.soldier);
    await page.goto("/support-form/goals?formId=test-sf-davis-1783951336663");
    const soldierGoalCard = page.locator("article").filter({ hasText: title });
    await expect(soldierGoalCard.getByText("NEEDS REVISION")).toBeVisible({ timeout: 45_000 });
    await expect(soldierGoalCard.getByText(guidance)).toBeVisible({ timeout: 45_000 });
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
