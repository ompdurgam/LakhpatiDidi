import { useQuery } from "@tanstack/react-query"

import { api } from "@/api/client"
import type { ApplicationRow } from "@/api/types"
import { useSession } from "@/stores/session"

export type DidiProfileData = {
  profile: {
    code: string
    name: string
    initials: string
    guardian: string | null
    age: number | null
    mobile: string
    category: string
    special: string | null
    pld: boolean
    village: string
    panchayat: string
    block: string
    district: string
    shg: string | null
    vo: string | null
    clf: string | null
  }
  meter: {
    income: number
    target: number
    threshold: number
    remaining: number
    percent: number
    status: "in_progress" | "threshold" | "lakhpati" | "single_source" | "gap"
    statusLabel: string
    activeSources: number
  }
  incomeSources: { name: string; months: string[]; gross: number; cost: number; net: number }[]
  gaps: { code: string; name: string; department: string; open: boolean; identifiedOn: string }[]
  applications: ApplicationRow[]
  tasks: { items: DidiTask[]; done: number; total: number; percent: number }
}

export type DidiTask = {
  id: string
  kind: "second_source" | "scheme_gap" | "info_requested" | "delivery" | "lakhpati"
  done: boolean
  application?: string
  scheme?: string
}

/** The signed-in Didi's own profile (the API finds it from her verified mobile). */
export function useDidi() {
  const signedIn = useSession((s) => Boolean(s.token))
  return useQuery({
    queryKey: ["didi", "me"],
    queryFn: () => api<DidiProfileData>("/didi/me"),
    enabled: signedIn,
    staleTime: 60_000,
    retry: false,
  })
}
