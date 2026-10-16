import { describe, expect, it } from "vitest";
import {
  isToday,
  isOverdue,
  localDateTimeToISO,
  relativeTime,
  selectLeads,
} from "@/lib/leads";
import type { Lead } from "@/lib/types";

const lead = (id: number, changes: Partial<Lead> = {}): Lead => ({
  id,
  name: `Person ${id}`,
  company: null,
  phone: null,
  status: "New",
  follow_up_at: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  last_note: null,
  last_discussion_at: null,
  ...changes,
});

describe("local-time reminders", () => {
  it("recognizes local midnight boundaries", () => {
    const now = new Date(2026, 9, 16, 12);
    expect(isToday(new Date(2026, 9, 16, 0).toISOString(), now)).toBe(true);
    expect(isToday(new Date(2026, 9, 17, 0).toISOString(), now)).toBe(false);
    expect(isToday(new Date(2026, 9, 15, 23, 59).toISOString(), now)).toBe(
      false,
    );
  });
  it("handles year rollover", () => {
    expect(
      isToday(
        new Date(2027, 0, 1, 0).toISOString(),
        new Date(2026, 11, 31, 23),
      ),
    ).toBe(false);
  });
  it("uses strict earlier-than comparison for overdue", () => {
    const now = new Date("2026-10-16T12:00:00Z");
    expect(isOverdue(now.toISOString(), now)).toBe(false);
    expect(isOverdue("2026-10-16T11:59:59Z", now)).toBe(true);
    expect(isOverdue(null, now)).toBe(false);
  });
  it("round-trips browser local datetime", () => {
    expect(new Date(localDateTimeToISO("2026-10-16T14:30")).getHours()).toBe(
      14,
    );
    expect(() => localDateTimeToISO("")).toThrow("valid follow-up");
  });
  it("rejects nonexistent daylight-saving local times", () => {
    expect(() => localDateTimeToISO("2026-03-08T02:30")).toThrow(
      "clock change",
    );
  });
  it("handles days with DST changes without fixed 24-hour assumptions", () => {
    const now = new Date(2026, 2, 8, 12);
    expect(isToday(new Date(2026, 2, 8, 23, 30).toISOString(), now)).toBe(true);
    expect(isToday(new Date(2026, 2, 9, 0).toISOString(), now)).toBe(false);
  });
});

describe("lead selection", () => {
  const now = new Date(2026, 9, 16, 12);
  const examples = [
    lead(1, {
      name: "Ada",
      follow_up_at: new Date(2026, 9, 16, 14).toISOString(),
    }),
    lead(2, {
      name: "Ada Smith",
      follow_up_at: new Date(2026, 9, 16, 10).toISOString(),
      status: "Qualified",
    }),
    lead(3, { follow_up_at: new Date(2026, 9, 15, 10).toISOString() }),
    lead(4, { created_at: new Date(2026, 9, 16, 11).toISOString() }),
    lead(5),
  ];
  it("pins today's overdue and future reminders without duplication", () => {
    const result = selectLeads(examples, "", "All", "All", now);
    expect(result.today.map((item) => item.id)).toEqual([2, 1]);
    expect(result.others.map((item) => item.id)).toEqual([3, 4, 5]);
    expect(
      new Set([...result.today, ...result.others].map((item) => item.id)).size,
    ).toBe(5);
  });
  it("combines case-insensitive trimmed search with status and due filter", () => {
    expect(
      selectLeads(examples, "  ADA ", "Qualified", "Overdue", now).today.map(
        (item) => item.id,
      ),
    ).toEqual([2]);
  });
  it("shows only future timestamps for Upcoming, including later today", () => {
    expect(
      selectLeads(examples, "", "All", "Upcoming", now).today.map(
        (item) => item.id,
      ),
    ).toEqual([1]);
  });
  it("uses creation time for no-discussion leads and id for ties", () => {
    expect(
      selectLeads([lead(1), lead(2)], "", "All", "All", now).others.map(
        (item) => item.id,
      ),
    ).toEqual([2, 1]);
  });
  it("returns an empty result when filters do not match", () => {
    expect(selectLeads(examples, "nobody", "Lost", "Today", now).count).toBe(0);
  });
  it("formats just-now and elapsed discussion times", () => {
    expect(relativeTime(now.toISOString(), now)).toBe("Just now");
    expect(
      relativeTime(new Date(now.getTime() - 7200000).toISOString(), now),
    ).toBe("2h ago");
  });
});
