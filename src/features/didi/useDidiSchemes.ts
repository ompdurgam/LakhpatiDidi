import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/api/client"
import { notificationKeys } from "@/api/notifications"
import { useSession } from "@/stores/session"

import type { DidiRecommendations, SchemeFit } from "../recommendations/types"

/** A recommended scheme as the Didi sees it (no staff DPR state). */
export type DidiScheme = Omit<SchemeFit, "dpr">

export type DidiSchemesData = {
  income: number
  leverage: DidiRecommendations["leverage"]
  recommendations: DidiScheme[]
  entitlements: DidiRecommendations["entitlements"]
}

const key = ["didi", "me", "schemes"] as const

/** Schemes that suit the signed-in Didi, with her own answer per scheme. */
export function useDidiSchemes() {
  const signedIn = useSession((s) => Boolean(s.token))
  return useQuery({
    queryKey: key,
    queryFn: () => api<DidiSchemesData>("/didi/me/schemes"),
    enabled: signedIn,
    staleTime: 60_000,
    retry: false,
  })
}

/** "Yes, I want to apply" / "Not now"; refreshes the list and the bell (an open question gets answered). */
export function useAnswerScheme() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ code, answer }: { code: string; answer: "yes" | "no" }) =>
      api<{ message: string }>(`/didi/me/schemes/${encodeURIComponent(code)}/interest`, {
        body: { answer },
      }),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: notificationKeys.all }),
      ]),
  })
}
