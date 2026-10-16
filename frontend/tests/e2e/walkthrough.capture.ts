import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";

// Deliberate pauses make the recorded demonstration readable. Functional tests do not use them.
test("LeadFlow submission walkthrough", async ({ page }) => {
  await fs.mkdir("../docs/screenshots", { recursive: true });
  await fs.mkdir("../docs/video", { recursive: true });
  await page.clock.install({ time: new Date() });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open Sofia Chen", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/workspace-1440.png",
    fullPage: true,
  });
  await page.waitForTimeout(14_000);
  await page
    .getByRole("button", { name: "Open Sofia Chen", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText(/Shared the team plan/),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/screenshots/timeline.png" });
  await page.waitForTimeout(13_000);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Add lead", exact: true }).click();
  await page.screenshot({ path: "../docs/screenshots/add-lead.png" });
  await page
    .getByLabel("Full name")
    .pressSequentially("Alex Morgan", { delay: 100 });
  await page
    .getByLabel("Company")
    .pressSequentially("Meridian Advisors", { delay: 80 });
  await page.getByLabel("Phone").fill("+91 98765 43210");
  await page.waitForTimeout(7_000);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add lead", exact: true })
    .click();
  await page.waitForTimeout(7_000);
  await page
    .getByRole("button", { name: "Open Alex Morgan", exact: true })
    .click();
  await page
    .getByLabel("Add a discussion")
    .pressSequentially(
      "Discussed the team's workflow. Alex would like a proposal for 12 advisors.",
      { delay: 45 },
    );
  await page.getByLabel("Set follow-up", { exact: true }).check();
  const followUp = await page.evaluate(() => {
    const date = new Date();
    date.setHours(Math.min(date.getHours() + 1, 23), 59, 0, 0);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  });
  await page.getByLabel("Follow-up date and time").fill(followUp);
  await page.waitForTimeout(9_000);
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(
    page.getByRole("dialog").getByText(/Discussed the team's workflow/),
  ).toBeVisible();
  await page.waitForTimeout(9_000);
  await page.getByLabel("Lead status").selectOption("Qualified");
  await expect(page.getByLabel("Lead status")).toBeEnabled();
  await page.waitForTimeout(6_000);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page
      .getByRole("region", { name: "Today’s follow-ups" })
      .getByRole("button", { name: "Open Alex Morgan", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(10_000);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Open Alex Morgan", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(7_000);
  await page.getByRole("searchbox").pressSequentially("Alex", { delay: 150 });
  await page.waitForTimeout(7_000);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page.getByLabel("Follow-ups", { exact: true }).selectOption("Overdue");
  await page.screenshot({
    path: "../docs/screenshots/overdue.png",
    fullPage: true,
  });
  await page.waitForTimeout(8_000);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  for (const width of [768, 390, 360]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.screenshot({
      path: `../docs/screenshots/workspace-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(8_000);
  await page
    .getByRole("button", { name: "Open Alex Morgan", exact: true })
    .click();
  await page
    .getByLabel("Add a discussion")
    .fill("Confirmed the next step from mobile.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Confirmed the next step from mobile.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/screenshots/mobile-timeline.png" });
  await page.waitForTimeout(9_000);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(9_000);
  const video = page.video();
  await page.close();
  await video?.saveAs("../docs/video/leadflow-walkthrough.webm");
});
