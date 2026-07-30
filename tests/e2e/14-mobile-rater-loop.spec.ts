import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { USERS, loginAs } from "./helpers/auth";

const API = "http://localhost:4000/api";

test("mobile submission appears unchanged in the assigned rater queue", async ({ page, request }) => {
  const soldierHeaders = { Authorization: USERS.soldier.token };
  const raterHeaders = { Authorization: USERS.rater.token };
  const formsResponse = await request.get(`${API}/support-forms?soldierId=dev-sgt-davis`, { headers: soldierHeaders });
  expect(formsResponse.ok()).toBeTruthy();
  const forms = await formsResponse.json() as Array<{ id: string; ratingPeriodStart: string; ratingPeriodEnd: string | null; status: string }>;
  const now = new Date();
  const form = forms.find((candidate) => new Date(candidate.ratingPeriodStart) <= now && (!candidate.ratingPeriodEnd || new Date(candidate.ratingPeriodEnd) >= now) && candidate.status === "ACTIVE");
  test.skip(!form, "Requires scripts/seed-mobile-demo.ts to prepare the current Davis assignment-linked support form.");

  const goalsResponse = await request.get(`${API}/support-forms/${form!.id}/goals`, { headers: soldierHeaders });
  const goals = await goalsResponse.json() as Array<{ id: string; title: string; sectionKey: string }>;
  const goal = goals.find((candidate) => candidate.sectionKey === "LEADS");
  expect(goal).toBeTruthy();

  const marker = `MOBILE-QUEUE-E2E-${Date.now()}`;
  const entryResponse = await request.post(`${API}/support-forms/${form!.id}/entries`, {
    headers: { ...soldierHeaders, "X-MERIT-CLIENT": "mobile" },
    data: {
      clientRequestId: randomUUID(),
      section: "LEADS",
      entryType: "ACCOMPLISHMENT",
      rawText: `${marker} reconciled all assigned equipment before movement.`,
      entryDate: now.toISOString(),
      goalIds: [goal!.id],
    },
  });
  expect(entryResponse.status()).toBe(201);
  const entry = await entryResponse.json() as { id: string };

  try {
    const image = readFileSync(path.join(process.cwd(), "public/docs/Army_Star.jpg"));
    const artifactResponse = await request.post(`${API}/support-forms/${form!.id}/entries/${entry.id}/artifacts`, {
      headers: soldierHeaders,
      multipart: {
        file: { name: "Army_Star.jpg", mimeType: "image/jpeg", buffer: image },
        type: "PHOTO",
        flaggedByServiceMember: "true",
        flagNote: "Field evidence; verify against the authoritative record.",
      },
    });
    expect(artifactResponse.status()).toBe(201);

    const queueResponse = await request.get(`${API}/support-forms/rater-queue`, { headers: raterHeaders });
    expect(queueResponse.ok()).toBeTruthy();
    const queue = await queueResponse.json() as Array<{
      id: string;
      rawText: string;
      submissionSource: string;
      confirmationStatus: string;
      createdByUser: { firstName: string; lastName: string; rank: string };
      goalLinks: Array<{ goal: { title: string } }>;
      artifacts: Array<{ fileUrl: string; type: string; flaggedByServiceMember: boolean; flagNote: string }>;
    }>;
    const queued = queue.find((candidate) => candidate.id === entry.id);
    expect(queued).toMatchObject({
      rawText: `${marker} reconciled all assigned equipment before movement.`,
      submissionSource: "MOBILE_CAPTURE",
      confirmationStatus: "UNREVIEWED",
      createdByUser: { firstName: "James", lastName: "Davis", rank: "SGT" },
    });
    expect(queued!.goalLinks[0]?.goal.title).toBe(goal!.title);
    expect(queued!.artifacts[0]).toMatchObject({ type: "PHOTO", flaggedByServiceMember: true, flagNote: "Field evidence; verify against the authoritative record." });
    expect(queued!.artifacts[0]!.fileUrl).toContain(`/support-form-entries/${entry.id}/`);

    await loginAs(page, USERS.rater);
    await page.goto("/support-form");
    const queueCard = page.getByRole("article").filter({ hasText: marker });
    await expect(queueCard).toBeVisible();
    await expect(queueCard.getByText("Captured on mobile")).toBeVisible();
    await expect(queueCard.getByText(`Goal: ${goal!.title}`)).toBeVisible();
    await expect(queueCard.getByText(/Disclosure: Field evidence/)).toBeVisible();
    await expect(queueCard.getByRole("img", { name: "Submitted evidence" })).toBeVisible();
  } finally {
    const withdrawResponse = await request.post(`${API}/support-forms/entries/${entry.id}/withdraw`, {
      headers: soldierHeaders,
      data: { reason: "Disposable mobile queue acceptance fixture." },
    });
    expect(withdrawResponse.status()).toBe(204);
  }
});