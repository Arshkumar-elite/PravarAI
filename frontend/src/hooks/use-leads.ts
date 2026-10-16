"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead, LeadDetail } from "@/lib/types";

export function useLeads() {
  return useQuery({ queryKey: ["leads"], queryFn: ({ signal }) => api.leads(signal) });
}
export function useLead(id: number) {
  return useQuery({ queryKey: ["lead", id], queryFn: ({ signal }) => api.detail(id, signal) });
}
export function useLeadActions(id?: number) {
  const client = useQueryClient();
  async function cancel() {
    await Promise.all([client.cancelQueries({ queryKey: ["leads"] }), client.cancelQueries({ queryKey: ["lead", id] })]);
  }
  function update(lead: Lead) {
    client.setQueryData<Lead[]>(["leads"], (previous) => {
      if (!previous) return [lead];
      return previous.some((item) => item.id === lead.id)
        ? previous.map((item) => item.id === lead.id ? lead : item) : [...previous, lead];
    });
    client.setQueryData<LeadDetail>(["lead", lead.id], (previous) => previous ? { ...previous, ...lead } : previous);
  }
  function refresh() {
    void client.invalidateQueries({ queryKey: ["leads"] });
    if (id) void client.invalidateQueries({ queryKey: ["lead", id] });
  }
  const create = useMutation({ mutationFn: api.create, onMutate: cancel, onSuccess: (lead) => { update(lead); refresh(); } });
  const patch = useMutation({ mutationFn: (data: Parameters<typeof api.patch>[1]) => api.patch(id!, data), onMutate: cancel,
    onSuccess: (lead) => { update(lead); refresh(); } });
  const discuss = useMutation({ mutationFn: (data: Parameters<typeof api.discuss>[1]) => api.discuss(id!, data), onMutate: cancel,
    onSuccess: (result) => {
      update(result.lead);
      client.setQueryData<LeadDetail>(["lead", id], (previous) => previous ? {
        ...previous, ...result.lead, discussions: [result.discussion, ...previous.discussions],
      } : previous);
      refresh();
    } });
  return { create, patch, discuss };
}
