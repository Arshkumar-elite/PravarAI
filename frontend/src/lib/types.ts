export const statuses = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
] as const;
export type Status = (typeof statuses)[number];
export interface Lead {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  status: Status;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  last_note: string | null;
  last_discussion_at: string | null;
}
export interface Discussion {
  id: number;
  lead_id: number;
  note: string;
  follow_up_at: string | null;
  created_at: string;
}
export interface LeadDetail extends Lead {
  discussions: Discussion[];
}
export interface DiscussionResult {
  discussion: Discussion;
  lead: Lead;
}
export type FollowFilter = "All" | "Today" | "Overdue" | "Upcoming";
