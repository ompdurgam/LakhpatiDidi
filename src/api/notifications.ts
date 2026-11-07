import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useSession } from "@/stores/session"

import { api } from "./client"

export type Notice = {
  id: number
  type: string
  category: "workflow" | "reminder" | "alert" | "system"
  priority: "low" | "normal" | "high" | "urgent"
  title: string
  body: string
  link: string | null
  entity: { type: string; ref: string } | null
  read: boolean
  /** Answer buttons of an actionable notice ("Yes, I want to apply" / "Not now"). */
  actions: { id: string; label: string }[]
  /** The answer already given (id of one of `actions`). */
  response: string | null
  createdAt: string
}

type InboxPage = { items: Notice[]; nextCursor: number | null; unread: number }

export const notificationKeys = {
  all: ["notifications"] as const,
  inbox: ["notifications", "inbox"] as const,
  unread: ["notifications", "unread"] as const,
}

// Every signed-in role has an inbox, a Didi included.
const useSignedIn = () => useSession((s) => Boolean(s.token))

/** Badge count. Polls gently; a push or focus refreshes it sooner. */
export function useUnreadCount() {
  const signedIn = useSignedIn()
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => api<{ unread: number }>("/notifications/unread-count"),
    select: (data) => data.unread,
    enabled: signedIn,
    refetchInterval: 60_000,
  })
}

/** Inbox pages, newest first (keyset cursor from the API). */
export function useInbox(enabled: boolean) {
  const signedIn = useSignedIn()
  return useInfiniteQuery({
    queryKey: notificationKeys.inbox,
    queryFn: ({ pageParam }) =>
      api<InboxPage>(`/notifications?limit=15${pageParam ? `&before=${pageParam}` : ""}`),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: signedIn && enabled,
  })
}

/** Marks some (or all) notices read and updates the badge straight from the reply. */
export function useMarkRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[] | "all") =>
      api<{ unread: number }>("/notifications/read", {
        body: ids === "all" ? { all: true } : { ids },
      }),
    onSuccess: ({ unread }) => {
      client.setQueryData(notificationKeys.unread, { unread })
      void client.invalidateQueries({ queryKey: notificationKeys.inbox })
    },
  })
}

/** Answers an actionable notice; the reply refreshes the inbox and badge. */
export function useRespond() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, answer }: { id: number; answer: string }) =>
      api<{ response: string }>(`/notifications/${id}/respond`, { body: { answer } }),
    onSuccess: () => void client.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
