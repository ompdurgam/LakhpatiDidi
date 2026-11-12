// Field work without a reliable network: the survey in progress is saved on the
// phone as the CRP fills it, and a survey submitted while offline waits in an
// outbox that is sent as soon as the connection returns.
import { useCallback, useEffect, useState } from "react"

import { api, ApiError } from "@/api/client"
import type { IncomeEntry } from "@/features/survey/types"
import { useSession } from "@/stores/session"

export type LocalDraft = {
  responses: Record<string, string>
  incomeEntries: IncomeEntry[]
  step: number
  livelihoods: string[]
  savedAt: string
}

export type OutboxItem = {
  id: string
  name: string
  body: unknown
  queuedAt: string
  /** Set when the server refused it (e.g. a missing field), so it is not retried blindly. */
  error?: string
}

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (key: string, value: unknown) => {
  try {
    if (value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the form still works, only without the phone copy.
  }
}

const userId = () => useSession.getState().user?.id ?? 0
const draftKey = (household?: string) => `ld.survey-draft:${userId()}:${household ?? "new"}`
const outboxKey = () => `ld.survey-outbox:${userId()}`

export const loadDraft = (household?: string) => read<LocalDraft | null>(draftKey(household), null)
export const saveDraft = (household: string | undefined, draft: LocalDraft) =>
  write(draftKey(household), draft)
export const clearDraft = (household?: string) => write(draftKey(household), undefined)

const listeners = new Set<() => void>()
const changed = () => listeners.forEach((fn) => fn())

export const readOutbox = () => read<OutboxItem[]>(outboxKey(), [])
const writeOutbox = (items: OutboxItem[]) => {
  write(outboxKey(), items)
  changed()
}

/** Keeps a survey that could not be sent (no network) for sending later. */
export function queueSurvey(name: string, body: unknown) {
  writeOutbox([
    ...readOutbox(),
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      body,
      queuedAt: new Date().toISOString(),
    },
  ])
}

let flushing = false

/** Sends waiting surveys in order; stops at the first network failure. Returns how many were sent. */
export async function flushOutbox() {
  if (flushing) return 0
  flushing = true
  let sent = 0
  try {
    for (const item of readOutbox()) {
      if (item.error) continue
      try {
        await api("/surveys", { body: item.body })
        writeOutbox(readOutbox().filter((i) => i.id !== item.id))
        sent += 1
      } catch (e) {
        // Still offline: try again later. A refusal from the server is kept with its reason.
        if (e instanceof ApiError && e.status === 0) break
        writeOutbox(
          readOutbox().map((i) => (i.id === item.id ? { ...i, error: (e as Error).message } : i)),
        )
      }
    }
  } finally {
    flushing = false
  }
  return sent
}

export const removeFromOutbox = (id: string) => writeOutbox(readOutbox().filter((i) => i.id !== id))

/** Outbox items, the network state, and a sync action; syncs by itself when back online. */
export function useOutbox(onSent?: (n: number) => void) {
  const [items, setItems] = useState(readOutbox)
  const [online, setOnline] = useState(() => navigator.onLine)
  const sync = useCallback(async () => {
    const n = await flushOutbox()
    if (n) onSent?.(n)
  }, [onSent])
  useEffect(() => {
    const refresh = () => setItems(readOutbox())
    const goOnline = () => {
      setOnline(true)
      void sync()
    }
    const goOffline = () => setOnline(false)
    listeners.add(refresh)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    // Also retry every minute (the online event is not reliable on every phone).
    const timer = window.setInterval(() => void sync(), 60_000)
    void sync()
    return () => {
      listeners.delete(refresh)
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
      window.clearInterval(timer)
    }
  }, [sync])
  return { items, online, sync }
}
