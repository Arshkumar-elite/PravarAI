"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock, LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localDateTimeToISO } from "@/lib/leads";

const schema = z.object({
  note: z
    .string()
    .trim()
    .min(1, "Write a discussion note first.")
    .max(5000, "Keep notes under 5,001 characters."),
});

export function DiscussionComposer({
  onSave,
  busy,
  error,
}: {
  onSave: (data: { note: string; follow_up_at?: string }) => Promise<unknown>;
  busy: boolean;
  error: string | undefined;
}) {
  const [scheduled, setScheduled] = useState(false);
  const [date, setDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [saved, setSaved] = useState(false);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { note: "" } });
  return (
    <form
      className="composer"
      noValidate
      onSubmit={handleSubmit(async ({ note }) => {
        setDateError("");
        setSaved(false);
        let follow_up_at: string | undefined;
        if (scheduled) {
          try {
            follow_up_at = localDateTimeToISO(date);
          } catch (error) {
            setDateError((error as Error).message);
            return;
          }
        }
        try {
          await onSave({ note, ...(follow_up_at ? { follow_up_at } : {}) });
          reset();
          setScheduled(false);
          setDate("");
          setSaved(true);
        } catch {
          /* Keep the draft and schedule on failure. */
        }
      })}
    >
      <label htmlFor="discussion-note" className="composer-label">
        <Plus size={15} />
        Add a discussion
      </label>
      <textarea
        id="discussion-note"
        rows={3}
        maxLength={5000}
        disabled={busy || isSubmitting}
        placeholder="What did you discuss? Capture the details…"
        aria-invalid={!!errors.note}
        aria-describedby={errors.note ? "note-error" : undefined}
        {...register("note")}
      />
      {errors.note && (
        <p id="note-error" className="field-error" role="alert">
          {errors.note.message}
        </p>
      )}
      <div className="composer-actions">
        <label className="schedule-toggle">
          <input
            type="checkbox"
            checked={scheduled}
            disabled={busy || isSubmitting}
            onChange={(event) => setScheduled(event.target.checked)}
          />
          <CalendarClock size={16} />
          Set follow-up
        </label>
        <Button type="submit" disabled={busy || isSubmitting}>
          {busy && <LoaderCircle size={15} className="spin" />}Save note
        </Button>
      </div>
      {scheduled && (
        <div className="schedule-field field">
          <label htmlFor="follow-up-date">
            Follow-up date and time <span>{timezone}</span>
          </label>
          <input
            id="follow-up-date"
            type="datetime-local"
            value={date}
            disabled={busy || isSubmitting}
            onChange={(event) => setDate(event.target.value)}
            aria-invalid={!!dateError}
            aria-describedby={dateError ? "date-error" : undefined}
          />
          {dateError && (
            <p id="date-error" className="field-error" role="alert">
              {dateError}
            </p>
          )}
        </div>
      )}
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      <span className="sr-only" role="status">
        {saved ? "Discussion saved" : ""}
      </span>
    </form>
  );
}
