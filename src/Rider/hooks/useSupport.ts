import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTicket,
  getSupportRides,
  getTicketMessages,
  getTickets,
  getUnreadTickets,
  markTicketRead,
  reopenTicket,
  resolveTicket,
  sendTicketAttachment,
  sendTicketMessage,
  type TicketQuery,
} from "../api/support";

export const useSupportRides = () =>
  useQuery({ queryKey: ["support", "rides"], queryFn: getSupportRides, staleTime: 60_000, retry: 1 });

export const useSupportTickets = (q: TicketQuery) =>
  useQuery({
    queryKey: ["support", "tickets", q],
    queryFn: () => getTickets(q),
    refetchInterval: 20_000,
    retry: 1,
  });

export const useUnreadTickets = () =>
  useQuery({
    queryKey: ["support", "unread"],
    queryFn: getUnreadTickets,
    refetchInterval: 30_000,
    retry: false,
  });

export const useTicketMessages = (id: string) =>
  useQuery({
    queryKey: ["support", "messages", id],
    queryFn: () => getTicketMessages(id),
    refetchInterval: 4_000,
    retry: 1,
  });

function useRefreshSupport() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["support"] });
}

export function useCreateTicket() {
  const refresh = useRefreshSupport();
  return useMutation({ mutationFn: createTicket, onSuccess: refresh });
}

export function useSendTicketMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendTicketMessage(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support", "messages", id] }),
  });
}

export function useSendTicketAttachment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => sendTicketAttachment(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support", "messages", id] }),
  });
}

export function useMarkTicketRead() {
  const refresh = useRefreshSupport();
  return useMutation({ mutationFn: markTicketRead, onSuccess: refresh });
}

export function useResolveTicket() {
  const refresh = useRefreshSupport();
  return useMutation({ mutationFn: resolveTicket, onSuccess: refresh });
}

export function useReopenTicket() {
  const refresh = useRefreshSupport();
  return useMutation({ mutationFn: reopenTicket, onSuccess: refresh });
}
