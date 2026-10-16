import { expect, test } from "@playwright/test";

test("create, discuss, change status and reload @smoke", async ({
  page,
}, testInfo) => {
  const name = `Alex Morgan ${testInfo.project.name}`;
  await page.goto("/");
  await page.getByRole("button", { name: "Add lead", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name").fill(name);
  await dialog.getByLabel("Company").fill("Meridian Advisors");
  await dialog.getByLabel("Phone").fill("+91 98765 43210");
  await dialog.getByRole("button", { name: "Add lead", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: `Open ${name}`, exact: true }).click();
  await expect(dialog.getByText("No discussions yet")).toBeVisible();
  await dialog
    .getByLabel("Add a discussion")
    .fill("Reviewed requirements and agreed on a demo.");
  await dialog.getByRole("button", { name: "Save note" }).click();
  await expect(
    dialog.getByText("Reviewed requirements and agreed on a demo.", {
      exact: true,
    }),
  ).toBeVisible();
  await dialog.getByLabel("Lead status").selectOption("Qualified");
  await expect(dialog.getByLabel("Lead status")).toHaveValue("Qualified");
  await expect(dialog.getByLabel("Lead status")).toBeEnabled();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  const row = page
    .locator(".lead-row")
    .filter({
      has: page.getByRole("button", { name: `Open ${name}`, exact: true }),
    });
  await expect(row).toContainText("Reviewed requirements");
  await expect(row).toContainText("Qualified");
  await page.reload();
  await expect(row).toContainText("Qualified");
  await expect(row).toContainText("Reviewed requirements");
  await expect(page).toHaveURL("/");
});
