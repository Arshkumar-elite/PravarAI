import {
  ArrowUpRight,
  CalendarClock,
  MessageSquare,
  Clock3,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { followLabel, fullDate, isOverdue, relativeTime } from "@/lib/leads";
import type { Lead } from "@/lib/types";

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
export function LeadRow({
  lead,
  now,
  onClick,
}: {
  lead: Lead;
  now: Date;
  onClick: () => void;
}) {
  const late = isOverdue(lead.follow_up_at, now);
  return (
    <article className="lead-row">
      <span className="lead-identity">
        <span className={`avatar avatar-${lead.id % 5}`}>
          {initials(lead.name)}
        </span>
        <span className="identity-text">
          <button
            type="button"
            className="lead-name"
            onClick={onClick}
            aria-label={`Open ${lead.name}`}
            aria-describedby={`lead-note-${lead.id} lead-state-${lead.id}`}
          >
            {lead.name}
          </button>
          <span className="lead-company">
            {lead.company || "Independent contact"}
          </span>
        </span>
      </span>
      <span className="lead-conversation" id={`lead-note-${lead.id}`}>
        <span className={`note-preview ${!lead.last_note ? "no-note" : ""}`}>
          {lead.last_note || "No discussions yet"}
        </span>
        <span className="note-time">
          {lead.last_discussion_at ? (
            <>
              <MessageSquare size={12} />
              <time
                dateTime={lead.last_discussion_at}
                title={fullDate(lead.last_discussion_at)}
              >
                {relativeTime(lead.last_discussion_at, now)}
              </time>
            </>
          ) : (
            <>
              <MessageSquare size={12} />
              Start a conversation
            </>
          )}
        </span>
      </span>
      <span className="lead-state" id={`lead-state-${lead.id}`}>
        <StatusBadge status={lead.status} />
        {lead.follow_up_at ? (
          <span
            className={`follow-up ${late ? "overdue" : ""}`}
            title={fullDate(lead.follow_up_at)}
          >
            {late ? <Clock3 size={13} /> : <CalendarClock size={13} />}
            {late ? "Overdue · " : ""}
            {followLabel(lead.follow_up_at, now)}
          </span>
        ) : (
          <span className="no-follow-up">No follow-up set</span>
        )}
      </span>
      <ArrowUpRight className="row-arrow" size={16} aria-hidden="true" />
    </article>
  );
}
