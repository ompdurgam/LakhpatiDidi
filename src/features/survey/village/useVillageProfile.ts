import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { create } from "zustand"

import { api } from "@/api/client"

import { emptyResponses, type VillageResponses } from "./catalog"

export type VillageOption = {
  code: string
  name: string
  panchayat: string
  savedAt: string | null
}

export type VillageProfileData = {
  code: string
  name: string
  panchayat: string
  block: string
  responses: Partial<VillageResponses>
  savedAt: string | null
  savedBy: string | null
}

/** Villages in the surveyor's area (profiled ones first). */
export function useVillageOptions(q: string) {
  return useQuery({
    queryKey: ["village-profile", "list", q],
    queryFn: () => api<VillageOption[]>(`/surveys/villages?${new URLSearchParams({ q })}`),
  })
}

export function useVillageProfile(code: string | undefined) {
  return useQuery({
    queryKey: ["village-profile", "one", code],
    queryFn: () => api<VillageProfileData>(`/surveys/villages/${code}/profile`),
    enabled: Boolean(code),
  })
}

export function useSaveVillageProfile(code: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (responses: VillageResponses) =>
      api<{ message: string }>(`/surveys/villages/${code}/profile`, {
        method: "PUT",
        body: responses,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["village-profile"] }),
  })
}

/** The profile being edited, shared with the desktop summary panel beside the form. */
export const useVillageDraft = create<{
  village: { name: string; panchayat: string; block: string } | null
  responses: VillageResponses
  set: (
    village: { name: string; panchayat: string; block: string } | null,
    responses: VillageResponses,
  ) => void
}>((setState) => ({
  village: null,
  responses: emptyResponses(),
  set: (village, responses) => setState({ village, responses }),
}))
