import type { Status } from "@/lib/types";
export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge status-${status.toLowerCase().replaceAll(" ", "-")}`}><span />{status}</span>;
}
