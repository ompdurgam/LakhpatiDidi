import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/api/client"
import { useResource } from "@/api/hooks"

import type { CostItem, DprBoardData, DprData, SentDpr } from "./types"

export const useDprBoard = (search: string) =>
  useResource<DprBoardData>(`/dpr?q=${encodeURIComponent(search)}`)

const dprPath = (code: string, scheme: string) =>
  `/dpr/${encodeURIComponent(code)}/${encodeURIComponent(scheme)}`

export const useDprData = (code: string, scheme: string) =>
  useResource<DprData>(dprPath(code, scheme))

export type SaveBody = { step: number; items: CostItem[]; remarks: string; documents: string[] }

/** Save-draft and send mutations; both refresh the lists that show DPR status. */
export function useDprActions(code: string, scheme: string) {
  const client = useQueryClient()
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["resource"] })
    void client.invalidateQueries({ queryKey: ["applications"] })
  }
  const save = useMutation({
    mutationFn: (body: SaveBody) => api(dprPath(code, scheme), { method: "PUT", body }),
    onSuccess: refresh,
  })
  const send = useMutation({
    mutationFn: () => api<SentDpr>(`${dprPath(code, scheme)}/send`, { method: "POST", body: {} }),
    onSuccess: refresh,
  })
  return { save, send }
}
