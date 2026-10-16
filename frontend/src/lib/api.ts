import type { DiscussionResult, Lead, LeadDetail, Status } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("Couldn’t connect to LeadFlow. Check your connection and try again.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (typeof data?.detail === "string") throw new Error(data.detail);
    if (Array.isArray(data?.detail)) {
      throw new Error(data.detail.map((item: { loc: string[]; msg: string }) =>
        `${item.loc.at(-1)}: ${item.msg}`).join(". "));
    }
    throw new Error("We couldn’t save your changes. Please try again.");
  }
  return data as T;
}

export const api = {
  leads: (signal?: AbortSignal) => request<Lead[]>("/leads", { signal }),
  detail: (id: number, signal?: AbortSignal) => request<LeadDetail>(`/leads/${id}`, { signal }),
  create: (data: { name: string; company?: string; phone?: string }) =>
    request<Lead>("/leads", { method: "POST", body: JSON.stringify(data) }),
  patch: (id: number, data: { status?: Status; follow_up_at?: null }) =>
    request<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  discuss: (id: number, data: { note: string; follow_up_at?: string }) =>
    request<DiscussionResult>(`/leads/${id}/discussions`, { method: "POST", body: JSON.stringify(data) }),
};
