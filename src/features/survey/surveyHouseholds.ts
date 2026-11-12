// Didis already on record (e.g. the state PLD list) that a surveyor completes.
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

import { api } from "@/api/client"

export type SurveyStatusFilter = "pending" | "done" | "all"

export type SurveyListItem = {
  code: string
  name: string
  guardian: string | null
  village: string
  shg: string | null
  pld: boolean
  surveyed: boolean
  income: number
}

export type SurveyList = {
  total: number
  pending: number
  done: number
  hasMore: boolean
  items: SurveyListItem[]
}

export type SurveyHousehold = {
  code: string
  memberCode: string | null
  name: string
  guardian: string | null
  age: number | null
  mobile: string | null
  category: string
  surveyed: boolean
  district: string
  block: string
  panchayat: string
  village: string
  shg: string | null
}

const KEY = "survey-households"

export function useSurveyHouseholds(q: string, status: SurveyStatusFilter, page: number) {
  return useQuery({
    queryKey: [KEY, "list", q, status, page],
    queryFn: () =>
      api<SurveyList>(
        `/surveys/households?${new URLSearchParams({ q, status, page: String(page) })}`,
      ),
    placeholderData: keepPreviousData,
  })
}

export function useSurveyHousehold(code: string | undefined) {
  return useQuery({
    queryKey: [KEY, "one", code],
    queryFn: () => api<SurveyHousehold>(`/surveys/households/${encodeURIComponent(code!)}`),
    enabled: Boolean(code),
  })
}

/** Re-fetches the work list after a survey is submitted. */
export function useRefreshSurveyList() {
  const client = useQueryClient()
  return useCallback(() => client.invalidateQueries({ queryKey: [KEY] }), [client])
}

/** Survey-form labels → the Didi's values, so her survey opens prefilled. */
export const prefillDraft = (h: SurveyHousehold): Record<string, string> => ({
  जिला: h.district,
  ब्लॉक: h.block,
  "ग्राम पंचायत": h.panchayat,
  गाँव: h.village,
  "SHG नाम": h.shg ?? "",
  "SHG सदस्य का नाम": h.name,
  "माता-पिता/पति का नाम": h.guardian ?? "",
  आयु: h.age ? String(h.age) : "",
  "मोबाइल (10 अंक)": h.mobile ?? "",
  "सामाजिक वर्ग": categoryLabel(h.category),
  // She is on the state's PLD list, in her SHG.
  "क्या संभावित लखपति दीदी (PLD) हैं?": "हाँ",
  "क्या महिला SHG सदस्य है?": h.shg ? "हाँ" : "",
  "सदस्य किस संगठन की": JSON.stringify(h.shg ? ["SHG"] : []),
  "सदस्य ID / LokOS ID": h.memberCode ?? "",
})

/** Household category code → the survey's chip label. */
export const categoryLabel = (code: string) => ({ GEN: "सामान्य", OTHER: "अन्य" })[code] ?? code
