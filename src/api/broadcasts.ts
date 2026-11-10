import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { Role } from "@/stores/session"
import { useSession } from "@/stores/session"

import { api } from "./client"

/** What the signed-in person may send: roles below them and, for state/district staff, areas. */
export type BroadcastOptions = {
  roles: Role[]
  areaLevel: "district" | "block" | null
  areas: { id: number; name: string }[]
}

export type SentBroadcast = {
  id: number
  title: string
  body: string
  roles: Role[]
  people: number
  seen: number
  sentAt: string
}

export type BroadcastDraft = { roles: Role[]; area: number | null; title: string; body: string }

const keys = {
  options: ["broadcasts", "options"] as const,
  audience: (roles: Role[], area: number | null) =>
    ["broadcasts", "audience", roles, area] as const,
  sent: ["broadcasts", "sent"] as const,
}

/** Empty `roles` means this person cannot send notices (Didi, department officer). */
export function useBroadcastOptions() {
  const user = useSession((s) => s.user)
  return useQuery({
    queryKey: [...keys.options, user?.id],
    queryFn: () => api<BroadcastOptions>("/broadcasts/options"),
    enabled: Boolean(user) && user?.role !== "didi",
    staleTime: 10 * 60_000,
  })
}

/** How many people (and phones) the current choice reaches. */
export function useAudienceCount(roles: Role[], area: number | null) {
  return useQuery({
    queryKey: keys.audience(roles, area),
    queryFn: () =>
      api<{ people: number; phones: number }>(
        `/broadcasts/audience?roles=${roles.join(",")}${area ? `&area=${area}` : ""}`,
      ),
    enabled: roles.length > 0,
    placeholderData: (previous) => previous,
  })
}

export function useSentBroadcasts() {
  return useQuery({ queryKey: keys.sent, queryFn: () => api<SentBroadcast[]>("/broadcasts") })
}

export function useSendBroadcast() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (draft: BroadcastDraft) =>
      api<{ id: number; people: number; message: string }>("/broadcasts", { body: draft }),
    onSuccess: () => void client.invalidateQueries({ queryKey: keys.sent }),
  })
}
