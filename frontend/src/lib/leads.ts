import type { FollowFilter, Lead, Status } from "./types";

export function isToday(value: string | null, now: Date): boolean {
  if (!value) return false;
  const date = new Date(value);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
export function isOverdue(value: string | null, now: Date): boolean {
  return !!value && new Date(value).getTime() < now.getTime();
}
export function selectLeads(
  leads: Lead[],
  query: string,
  status: Status | "All",
  follow: FollowFilter,
  now: Date,
) {
  const filtered = leads.filter((lead) => {
    if (
      !lead.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    )
      return false;
    if (status !== "All" && lead.status !== status) return false;
    if (follow === "Today") return isToday(lead.follow_up_at, now);
    if (follow === "Overdue") return isOverdue(lead.follow_up_at, now);
    if (follow === "Upcoming")
      return !!lead.follow_up_at && new Date(lead.follow_up_at) > now;
    return true;
  });
  const today = filtered
    .filter((lead) => isToday(lead.follow_up_at, now))
    .sort(
      (a, b) =>
        Date.parse(a.follow_up_at!) - Date.parse(b.follow_up_at!) ||
        b.id - a.id,
    );
  const others = filtered
    .filter((lead) => !isToday(lead.follow_up_at, now))
    .sort((a, b) => {
      const aLate = isOverdue(a.follow_up_at, now),
        bLate = isOverdue(b.follow_up_at, now);
      if (aLate !== bLate) return aLate ? -1 : 1;
      if (aLate && bLate)
        return (
          Date.parse(a.follow_up_at!) - Date.parse(b.follow_up_at!) ||
          b.id - a.id
        );
      return (
        Date.parse(b.last_discussion_at || b.created_at) -
          Date.parse(a.last_discussion_at || a.created_at) || b.id - a.id
      );
    });
  return { today, others, count: filtered.length };
}

export function relativeTime(value: string, now: Date) {
  const seconds = Math.max(
    0,
    Math.floor((now.getTime() - Date.parse(value)) / 1000),
  );
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  return days < 30
    ? `${days}d ago`
    : new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
}
export function fullDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
export function followLabel(value: string, now: Date) {
  const date = new Date(value);
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return isToday(value, now)
    ? `Today, ${time}`
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
        `, ${time}`;
}
export function localDateTimeToISO(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new Error("Choose a valid follow-up date and time.");
  const parts = value.split(/[-T:]/).map(Number);
  if (
    date.getFullYear() !== parts[0] ||
    date.getMonth() + 1 !== parts[1] ||
    date.getDate() !== parts[2] ||
    date.getHours() !== parts[3] ||
    date.getMinutes() !== parts[4]
  ) {
    throw new Error(
      "This local time does not exist because of a clock change. Choose another time.",
    );
  }
  return date.toISOString();
}
