// The DPR tab: how many DPRs are drafted / filled / sent, and which Didi needs which DPR next.
import { query } from "../../db/pool.ts"
import type { Row } from "../../shared/types.ts"
import { loadSurveyed } from "../recommendations/household.ts"
import { recommendationsFor } from "../recommendations/recommendations.service.ts"
import { loadSchemes } from "../recommendations/schemes.ts"

export type BoardState = "filled" | "draft" | "todo" | "done"

/** Order the list: ready-to-send first, then drafts, then DPRs still to start, then finished. */
const ORDER: Record<BoardState, number> = { filled: 0, draft: 1, todo: 2, done: 3 }

export async function dprBoard(search: string) {
  const [households, schemes] = await Promise.all([loadSurveyed(search), loadSchemes()])
  const ids = households.map((h) => h.id)
  const [apps, drafts] = ids.length
    ? await Promise.all([
        query<Row>(
          `SELECT a.household_id, s.code FROM tbl_applications a
           JOIN master_schemes s ON s.id = a.scheme_id WHERE a.household_id IN (?)`,
          [ids],
        ),
        query<Row>(
          `SELECT d.household_id, s.code, d.status, d.current_step FROM tbl_dpr_drafts d
           JOIN master_schemes s ON s.id = d.scheme_id
           WHERE d.household_id IN (?) AND d.status <> 'sent' ORDER BY d.updated_at DESC`,
          [ids],
        ),
      ])
    : [[], []]

  const appliedBy = new Map<number, Set<string>>()
  for (const a of apps)
    appliedBy.set(a.household_id, (appliedBy.get(a.household_id) ?? new Set()).add(a.code))
  const draftsBy = new Map<number, Row[]>()
  for (const d of drafts) draftsBy.set(d.household_id, [...(draftsBy.get(d.household_id) ?? []), d])

  let draftCount = 0
  let filledCount = 0
  let sentCount = 0
  let todoCount = 0

  const items = households.map((h) => {
    const applied = appliedBy.get(h.id) ?? new Set<string>()
    const mine = draftsBy.get(h.id) ?? []
    const filled = mine.filter((d) => d.status === "filled")
    const inDraft = mine.filter((d) => d.status === "draft")
    draftCount += inDraft.length
    filledCount += filled.length
    sentCount += applied.size

    const recs = recommendationsFor(h, schemes, applied)
    const focusDraft = filled[0] ?? inDraft[0]
    const startable = recs.find((r) => !mine.some((d) => d.code === r.code))
    const state: BoardState = filled.length
      ? "filled"
      : inDraft.length
        ? "draft"
        : startable
          ? "todo"
          : "done"
    if (state === "todo") todoCount += 1

    const focusCode = focusDraft?.code ?? startable?.code ?? null
    const focusScheme = focusCode ? schemes.get(focusCode) : undefined
    return {
      code: h.code,
      name: h.name,
      initials: h.initials,
      village: h.village,
      income: h.income,
      state,
      scheme: focusScheme
        ? { code: focusScheme.code, name: focusScheme.name, department: focusScheme.department }
        : null,
      step: focusDraft ? Number(focusDraft.current_step) : null,
      expectedGain: recs.find((r) => r.code === focusCode)?.gain ?? null,
      drafts: inDraft.length,
      filled: filled.length,
      sent: applied.size,
    }
  })

  items.sort((a, b) => ORDER[a.state] - ORDER[b.state])
  return {
    kpis: {
      didis: items.length,
      todo: todoCount,
      draft: draftCount,
      filled: filledCount,
      sent: sentCount,
    },
    items,
  }
}
