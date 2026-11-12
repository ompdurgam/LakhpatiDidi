// Screens open with the figures the user last saw, kept on the phone, while the
// fresh ones load behind them: no blank "Loading…" on every visit. The copy is
// per user, role and language, dropped after a day or a new app build, and
// wiped on sign-out (shared phones).
import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query"

import i18n from "@/i18n"
import { useSession } from "@/stores/session"

const PREFIX = "ld.query-cache:"
const MAX_AGE_MS = 24 * 60 * 60_000
const MAX_QUERY_CHARS = 300_000
const MAX_TOTAL_CHARS = 1_500_000
/** Map boundaries are large and already cached by the browser; not worth the space. */
const SKIPPED = new Set(["geo"])

type Saved = { at: number; build: string; state: ReturnType<typeof dehydrate> }

/** Changes with every deploy (the entry script is content-hashed), so old shapes are never shown. */
const build = () =>
  document.querySelector<HTMLScriptElement>("script[type=module][src]")?.src ?? "dev"

const storageKey = () => {
  const { user, role } = useSession.getState()
  return user ? `${PREFIX}${user.id}:${role}:${i18n.language}` : null
}

export function clearPersistedQueries() {
  try {
    for (const key of Object.keys(localStorage))
      if (key.startsWith(PREFIX)) localStorage.removeItem(key)
  } catch {
    // Storage blocked: nothing was saved.
  }
}

/** Puts the saved figures into the cache; they count as stale, so each screen refreshes at once. */
export function restoreQueries(client: QueryClient) {
  const key = storageKey()
  if (!key) return
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const saved = JSON.parse(raw) as Saved
    if (Date.now() - saved.at > MAX_AGE_MS || saved.build !== build()) {
      localStorage.removeItem(key)
      return
    }
    hydrate(client, saved.state)
  } catch {
    // A damaged copy only means a normal first load.
  }
}

function save(client: QueryClient) {
  const key = storageKey()
  if (!key) return
  let total = 0
  const state = dehydrate(client, {
    shouldDehydrateQuery: (query) => {
      if (query.state.status !== "success" || SKIPPED.has(String(query.queryKey[0]))) return false
      const size = JSON.stringify(query.state.data ?? null).length
      if (size > MAX_QUERY_CHARS || total + size > MAX_TOTAL_CHARS) return false
      total += size
      return true
    },
  })
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), build: build(), state }))
  } catch {
    // Storage full: keep working without the phone copy.
  }
}

/** Saves the cache a moment after it changes; returns the unsubscribe. */
export function persistQueries(client: QueryClient) {
  let timer: number | undefined
  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (event.type !== "updated" || event.action.type !== "success") return
    window.clearTimeout(timer)
    timer = window.setTimeout(() => save(client), 2000)
  })
  // Signing out (or a different user) must not leave someone's data on the phone.
  const unwatch = useSession.subscribe((now, before) => {
    if (!now.token && before.token) {
      window.clearTimeout(timer)
      clearPersistedQueries()
      client.clear()
    }
  })
  return () => {
    window.clearTimeout(timer)
    unsubscribe()
    unwatch()
  }
}
