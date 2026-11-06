import { useResource } from "@/api/hooks"

import type { DidiRecommendations, SurveyedDidi } from "./types"

export type SurveyedList = { total: number; items: SurveyedDidi[] }

export const useSurveyed = (search: string) =>
  useResource<SurveyedList>(`/recommendations?q=${encodeURIComponent(search)}`)

export const useDidiRecommendations = (code: string | undefined) =>
  useResource<DidiRecommendations>(code ? `/recommendations/${encodeURIComponent(code)}` : null)
