"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, Search, SlidersHorizontal, CalendarDays, Pin, UsersRound, X, Check, RefreshCw } from "lucide-react";
import { useLeads } from "@/hooks/use-leads";
import { useClock } from "@/hooks/use-clock";
import { selectLeads } from "@/lib/leads";
import { statuses, type Status, type FollowFilter } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LeadRow } from "@/components/lead-row";
import { AddLeadDialog } from "@/components/add-lead-dialog";
import { LeadDialog } from "@/components/lead-dialog";

export function Workspace() {
  const query = useLeads();
  const now = useClock();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status | "All">("All");
  const [follow, setFollow] = useState<FollowFilter>("All");
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(""), 5000); return () => clearTimeout(timer); } }, [notice]);
  const leads = query.data || [];
  const groups = now ? selectLeads(leads, search, status, follow, now) : { today: [], others: [], count: 0 };
  const filtered = !!search || status !== "All" || follow !== "All";
  function clearFilters() { setSearch(""); setStatus("All"); setFollow("All"); }

  return <>
    <a href="#leads" className="skip-link">Skip to leads</a>
    <header className="app-header"><div className="header-inner"><div className="brand"><span className="brand-mark"><ArrowUpRight size={23} strokeWidth={2.5} /></span><span>LeadFlow</span><span className="brand-divider" /><span className="workspace-label">Your workspace</span></div>
      <Button onClick={() => setAdding(true)}><Plus size={17} />Add lead</Button></div></header>
    <main id="leads" className="workspace">
      <div className="page-heading"><div><div className="title-line"><h1>Leads</h1>{query.data && <span className="total-count">{leads.length}</span>}</div><p>Your conversations, with the next step in sight.</p></div>
        {now && <span className="today-date"><CalendarDays size={15} />{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>}</div>
      <section className="lead-workspace" aria-label="Lead management">
        <div className="toolbar"><div className="search-field"><Search size={17} /><input type="search" aria-label="Search leads by name" placeholder="Search leads by name…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <div className="follow-filter"><SlidersHorizontal size={15} /><label htmlFor="follow-filter">Follow-ups</label><select id="follow-filter" value={follow} onChange={(event) => setFollow(event.target.value as FollowFilter)}>{["All", "Today", "Overdue", "Upcoming"].map((item) => <option key={item}>{item}</option>)}</select></div></div>
        <div className="status-filters" aria-label="Filter by status"><button className={status === "All" ? "active" : ""} aria-pressed={status === "All"} onClick={() => setStatus("All")}>All leads</button>
          {statuses.map((value) => <button key={value} className={status === value ? "active" : ""} aria-pressed={status === value} onClick={() => setStatus(value)}><span className={`filter-dot dot-${value.toLowerCase().replaceAll(" ", "-")}`} />{value}</button>)}
        </div>
        {filtered && <div className="filter-summary"><span>{groups.count} matching {groups.count === 1 ? "lead" : "leads"}</span><button onClick={clearFilters}><X size={13} />Clear filters</button></div>}
        {query.isPending || !now ? <div className="loading-list" role="status" aria-label="Loading leads">{[1, 2, 3, 4].map((key) => <div className="skeleton-row" key={key}><span /><span /><span /></div>)}<span className="sr-only">Loading leads</span></div> : query.isError && !query.data ?
          <div className="empty-state"><span className="empty-icon"><RefreshCw size={24} /></span><h2>Let’s get your leads back</h2><p role="alert">{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Try again</Button></div> : <>
            {query.isError && <div className="stale-banner" role="alert">Couldn’t refresh your leads. Showing the last loaded data. <button onClick={() => query.refetch()}>Try again</button></div>}
            {groups.count === 0 ? <div className="empty-state"><span className="empty-icon">{filtered ? <Search size={26} /> : <UsersRound size={26} />}</span><h2>{filtered ? "No leads found" : "Good relationships start here"}</h2><p>{filtered ? "Try a different name or adjust your filters." : "Add your first lead to keep conversations and follow-ups in one place."}</p><Button variant={filtered ? "outline" : "default"} onClick={filtered ? clearFilters : () => setAdding(true)}>{filtered ? "Clear filters" : "Add your first lead"}</Button></div> : <div className="lead-groups">
              {groups.today.length > 0 && <section className="today-group" aria-label="Today’s follow-ups"><div className="group-heading"><h2><Pin size={14} />Today’s follow-ups <span>{groups.today.length}</span></h2><span className="group-caption">A little attention goes a long way</span></div><div className="rows">{groups.today.map((lead) => <LeadRow key={lead.id} lead={lead} now={now} onClick={() => setSelected(lead.id)} />)}</div></section>}
              {groups.others.length > 0 && <section className="other-group" aria-label="Other leads"><div className="group-heading"><h2><UsersRound size={15} />{groups.today.length ? "Other leads" : "All leads"} <span>{groups.others.length}</span></h2><span className="group-caption">Latest conversations first</span></div><div className="rows">{groups.others.map((lead) => <LeadRow key={lead.id} lead={lead} now={now} onClick={() => setSelected(lead.id)} />)}</div></section>}
            </div>}
            <footer className="list-footer"><span>Showing {groups.count} of {leads.length} leads</span><span>Open a lead to see the full conversation<ArrowUpRight size={13} /></span></footer>
          </>}
      </section>
      <div className="workspace-footnote"><span className="small-brand-mark"><ArrowUpRight size={13} /></span><span>One workspace. Every next step.</span></div>
    </main>
    {notice && <div role="status" className="toast"><Check size={17} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={15} /></button></div>}
    {adding && <AddLeadDialog onClose={() => setAdding(false)} onSaved={(name) => { clearFilters(); setNotice(`${name} added to your leads`); }} />}
    {selected !== null && now && <LeadDialog key={selected} id={selected} now={now} onClose={() => setSelected(null)} />}
  </>;
}
