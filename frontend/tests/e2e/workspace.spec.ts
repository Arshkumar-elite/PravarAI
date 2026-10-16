import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";

const API = "http://127.0.0.1:8001/api";

test("long contact details and notes fit a short mobile viewport", async ({
  page,
  request,
}) => {
  const name = "Long " + "x".repeat(115);
  const lead = await (
    await request.post(`${API}/leads`, {
      data: {
        name,
        company: "Company".repeat(22),
        phone: "+1 " + "1".repeat(37),
      },
    })
  ).json();
  const note = "<script>not executable</script> " + "Long note ".repeat(490);
  await request.post(`${API}/leads/${lead.id}/discussions`, { data: { note } });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/");
  await page.getByRole("searchbox").fill(name);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: `Open ${name}`, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".discussion-card p")).toHaveText(note);
  expect(await dialog.locator("script").count()).toBe(0);
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog
    .getByLabel("Add a discussion")
    .fill("The composer remains reachable.");
  await dialog.getByRole("button", { name: "Save note" }).click();
  await expect(dialog.getByLabel("Add a discussion")).toHaveValue("");
});

test("real API reminders pin immediately and history is newest first", async ({
  page,
  request,
}) => {
  const created = await request.post(`${API}/leads`, {
    data: { name: "Reminder test" },
  });
  const lead = await created.json();
  await page.clock.install({ time: new Date("2026-10-16T06:30:00Z") });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open Reminder test", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Add a discussion").fill("Morning conversation");
  await dialog.getByLabel("Set follow-up", { exact: true }).check();
  await dialog.getByLabel("Follow-up date and time").fill("2026-10-16T10:00");
  await dialog.getByRole("button", { name: "Save note" }).click();
  await expect(
    dialog.getByText("Morning conversation", { exact: true }),
  ).toBeVisible();
  await dialog.getByLabel("Add a discussion").fill("Second conversation");
  await dialog.getByRole("button", { name: "Save note" }).click();
  await expect(dialog.locator(".timeline li").first()).toContainText(
    "Second conversation",
  );
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  const pinned = page.getByRole("region", { name: "Today’s follow-ups" });
  await expect(
    pinned.locator(".lead-row").filter({ hasText: "Reminder test" }),
  ).toContainText("Overdue");
  await expect(
    pinned.locator(".lead-row").filter({ hasText: "Reminder test" }),
  ).toContainText("Second conversation");
  await page.reload();
  await expect(
    pinned.getByRole("button", { name: "Open Reminder test", exact: true }),
  ).toBeVisible();
  const saved = await (await request.get(`${API}/leads/${lead.id}`)).json();
  expect(saved.follow_up_at).toBe("2026-10-16T04:30:00Z");
  await page
    .getByRole("button", { name: "Open Reminder test", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Clear follow-up" }).click();
  await expect(
    dialog.getByRole("button", { name: "Clear follow-up" }),
  ).not.toBeVisible();
  await expect(dialog.getByText(/Follow-up set for/)).toBeVisible();
});

test("search and combined filters apply to both groups", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-16T06:30:00Z") });
  await page.goto("/");
  await page.getByRole("searchbox").fill("  SOFIA  ");
  await expect(
    page.getByRole("button", { name: "Open Sofia Chen", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Proposal Sent", exact: true })
    .click();
  await page.getByLabel("Follow-ups", { exact: true }).selectOption("Today");
  await expect(
    page.getByRole("button", { name: "Open Sofia Chen", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Won", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No leads found" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Open Sofia Chen", exact: true }),
  ).toBeVisible();
});

test("failed save keeps draft and a retry sends exactly one successful discussion", async ({
  page,
  request,
}) => {
  const lead = await (
    await request.post(`${API}/leads`, { data: { name: "Failure recovery" } })
  ).json();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open Failure recovery", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Add a discussion").fill("A draft worth keeping.");
  const path = `**/api/leads/${lead.id}/discussions`;
  await page.route(path, (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Temporary service failure" }),
    }),
  );
  await dialog.getByRole("button", { name: "Save note" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Temporary service failure",
  );
  await expect(dialog.getByLabel("Add a discussion")).toHaveValue(
    "A draft worth keeping.",
  );
  await page.unroute(path);
  await dialog.getByRole("button", { name: "Save note" }).click();
  await expect(dialog.getByLabel("Add a discussion")).toHaveValue("");
  expect(
    (await (await request.get(`${API}/leads/${lead.id}`)).json()).discussions,
  ).toHaveLength(1);
});

test("empty and unavailable API states offer recovery", async ({ page }) => {
  await page.route("**/api/leads", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good relationships start here" }),
  ).toBeVisible();
  await page.unroute("**/api/leads");
  await page.route("**/api/leads", (route) => route.abort());
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
});

test("keyboard focus is contained and restored", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Add lead", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Full name")).toBeFocused();
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("desktop and dialogs meet automated accessibility checks", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open Sofia Chen", exact: true }),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "Add lead", exact: true }).click();
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Open Sofia Chen", exact: true })
    .click();
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
});

test("mobile creation, discussion and no page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Add lead", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name").fill("Mobile contact");
  await dialog.getByRole("button", { name: "Add lead", exact: true }).click();
  await page
    .getByRole("button", { name: "Open Mobile contact", exact: true })
    .click();
  await dialog.getByLabel("Add a discussion").fill("Saved from a phone.");
  await dialog.getByRole("button", { name: "Save note" }).click();
  await expect(
    dialog.getByText("Saved from a phone.", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("timezone and midnight grouping refresh in an open page", async ({
  browser,
  request,
}) => {
  const lead = await (
    await request.post(`${API}/leads`, { data: { name: "Midnight contact" } })
  ).json();
  await request.post(`${API}/leads/${lead.id}/discussions`, {
    data: {
      note: "Tomorrow in India, today in New York",
      follow_up_at: "2026-11-02T04:30:00Z",
    },
  });
  const context = await browser.newContext({
    timezoneId: "America/New_York",
    baseURL: "http://127.0.0.1:3001",
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-11-02T04:59:30Z") });
  await page.goto("/");
  await expect(
    page
      .getByRole("region", { name: "Today’s follow-ups" })
      .getByRole("button", { name: "Open Midnight contact", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(61_000);
  await expect(
    page
      .getByRole("region", { name: "Other leads" })
      .locator(".lead-row")
      .filter({ hasText: "Midnight contact" }),
  ).toContainText("Overdue");
  await context.close();
});

test("capture responsive evidence and detect console failures", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await fs.mkdir("../docs/screenshots", { recursive: true });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open Sofia Chen", exact: true }),
  ).toBeVisible();
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `../docs/screenshots/workspace-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Add lead", exact: true }).click();
  await page.screenshot({ path: "../docs/screenshots/add-lead.png" });
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Open Sofia Chen", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText(/Shared the team plan/),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/screenshots/timeline.png" });
  expect(errors).toEqual([]);
});
