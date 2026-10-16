import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { DiscussionComposer } from "@/components/discussion-composer";

it("does not submit a blank discussion", async () => {
  const save = vi.fn();
  render(<DiscussionComposer onSave={save} busy={false} error={undefined} />);
  await userEvent.click(screen.getByRole("button", { name: "Save note" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Write a discussion note first",
  );
  expect(save).not.toHaveBeenCalled();
});

it("retains the draft after a failed save", async () => {
  const save = vi.fn().mockRejectedValue(new Error("Offline"));
  render(
    <DiscussionComposer onSave={save} busy={false} error="Couldn’t save" />,
  );
  await userEvent.type(
    screen.getByLabelText("Add a discussion"),
    "Discussed pricing.",
  );
  await userEvent.click(screen.getByRole("button", { name: "Save note" }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(screen.getByLabelText("Add a discussion")).toHaveValue(
    "Discussed pricing.",
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t save");
});

it("clears the draft only after success and announces it", async () => {
  const save = vi.fn().mockResolvedValue({});
  render(<DiscussionComposer onSave={save} busy={false} error={undefined} />);
  await userEvent.type(
    screen.getByLabelText("Add a discussion"),
    "  Next steps agreed.  ",
  );
  await userEvent.click(screen.getByRole("button", { name: "Save note" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Add a discussion")).toHaveValue(""),
  );
  expect(save).toHaveBeenCalledWith({ note: "Next steps agreed." });
  expect(screen.getByRole("status")).toHaveTextContent("Discussion saved");
});

it("requires a date when follow-up is enabled", async () => {
  const save = vi.fn();
  render(<DiscussionComposer onSave={save} busy={false} error={undefined} />);
  fireEvent.change(screen.getByLabelText("Add a discussion"), {
    target: { value: "Schedule" },
  });
  await userEvent.click(screen.getByLabelText("Set follow-up"));
  await userEvent.click(screen.getByRole("button", { name: "Save note" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("valid follow-up");
  expect(save).not.toHaveBeenCalled();
});

it("disables repeated submissions while a save is in progress", () => {
  render(<DiscussionComposer onSave={vi.fn()} busy error={undefined} />);
  expect(screen.getByRole("button", { name: "Save note" })).toBeDisabled();
});
