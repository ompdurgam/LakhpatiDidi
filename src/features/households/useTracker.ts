import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/api/client"

/** GET /api/households/:code/tracker */
export type Tracker = {
  profile: {
    code: string
    name: string
    initials: string
    village: string
    income: number
    surveyed: boolean
    status: string
  }
  /** Hindi label keys with the date reached (null = not yet). */
  milestones: { label: string; date: string | null; at: string | null }[]
  sources: { name: string; amount: number }[]
  applications: {
    code: string
    scheme: string
    department: string
    status: string
    overdue: boolean
    open: boolean
    days: number
  }[]
  gaps: { scheme: string; department: string; open: boolean; date: string | null }[]
  /** Last six months; `month` is YYYY-MM. */
  monthly: { month: string; source: string; amount: number }[]
}

const key = (code: string) => ["households", "tracker", code]

export function useTracker(code: string | undefined) {
  return useQuery({
    queryKey: key(code ?? ""),
    queryFn: () => api<Tracker>(`/households/${encodeURIComponent(code!)}/tracker`),
    enabled: Boolean(code),
  })
}

/** Saves this month's income from one source and refreshes the tracker. */
export function useAddIncome(code: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (entry: { source: string; amount: number }) =>
      api<{ message: string }>(`/households/${encodeURIComponent(code)}/income`, { body: entry }),
    onSuccess: () => client.invalidateQueries({ queryKey: key(code) }),
  })
}
