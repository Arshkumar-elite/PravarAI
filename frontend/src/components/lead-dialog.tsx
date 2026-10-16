"use client";
import { Building2, CalendarClock, MessageSquare, Phone, LoaderCircle, Clock3 } from "lucide-react";
import { useLead, useLeadActions } from "@/hooks/use-leads";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DiscussionComposer } from "@/components/discussion-composer";
import { initials } from "@/components/lead-row";
import { fullDate, relativeTime } from "@/lib/leads";
import { statuses, type Status } from "@/lib/types";

export function LeadDialog({ id, now, onClose }: { id: number; now: Date; onClose: () => void }) {
  const query = useLead(id);
  const { patch, discuss } = useLeadActions(id);
  const busy = patch.isPending || discuss.isPending;
  const lead = query.data;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="timeline-dialog">
      {!lead ? <div className="dialog-pending"><DialogTitle>Lead timeline</DialogTitle><DialogDescription>Conversation history and next steps.</DialogDescription>
        {query.isError ? <><p className="error-box" role="alert">{query.error.message}</p><Button onClick={() => query.refetch()}>Try again</Button></> : <LoaderCircle className="spin" aria-label="Loading timeline" />}
      </div> : <>
        <header className="timeline-header"><div className="timeline-person"><span className={`avatar avatar-large avatar-${id % 5}`}>{initials(lead.name)}</span>
          <div><DialogTitle>{lead.name}</DialogTitle><DialogDescription>{lead.company || "Independent contact"}</DialogDescription></div></div>
          <div className="contact-line">{lead.company && <span><Building2 size={14} />{lead.company}</span>}{lead.phone && <span><Phone size={14} />{lead.phone}</span>}</div>
          <div className="status-control"><label htmlFor="lead-status">Lead status</label><select id="lead-status" value={lead.status} disabled={busy} onChange={(event) => patch.mutate({ status: event.target.value as Status })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
            {patch.isPending && <LoaderCircle size={15} className="spin" />}</div>
          {lead.follow_up_at && <div className="current-follow"><span><CalendarClock size={15} />Next follow-up: {fullDate(lead.follow_up_at)}</span><button type="button" onClick={() => patch.mutate({ follow_up_at: null })} disabled={busy}>Clear follow-up</button></div>}
          {patch.error && <p className="error-box" role="alert">{patch.error.message}</p>}
          {query.isError && <p className="error-box" role="alert">Couldn’t refresh this lead. <button onClick={() => query.refetch()}>Try again</button></p>}
        </header>
        <div className="history" aria-label="Discussion history"><div className="history-heading"><h2><MessageSquare size={15} />Discussion history <span>{lead.discussions.length}</span></h2><span>Newest first</span></div>
          {lead.discussions.length === 0 ? <div className="empty-history"><MessageSquare size={24} /><h3>No discussions yet</h3><p>Add your first note below to start the conversation.</p></div> : <ol className="timeline">
            {lead.discussions.map((discussion) => <li key={discussion.id}><span className="timeline-dot" /><div className="discussion-meta"><time dateTime={discussion.created_at}>{fullDate(discussion.created_at)}</time><span>{relativeTime(discussion.created_at, now)}</span></div>
              <div className="discussion-card"><p>{discussion.note}</p>{discussion.follow_up_at && <span className="historical-follow"><CalendarClock size={13} />Follow-up set for {fullDate(discussion.follow_up_at)}</span>}</div>
            </li>)}
          </ol>}
          <div className="created-marker"><Clock3 size={13} />Lead created {fullDate(lead.created_at)}</div>
        </div>
        <DiscussionComposer onSave={discuss.mutateAsync} busy={busy} error={discuss.error?.message} />
      </>}
    </DialogContent>
  </Dialog>;
}
