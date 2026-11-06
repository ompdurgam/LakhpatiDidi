import { query } from "../../db/pool.ts"
import { notFound } from "../../shared/errors.ts"
import { localized, localizedName, msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { leverage, recommend } from "./engine.ts"
import { type Household, loadHousehold, loadSurveyed, toProfile } from "./household.ts"
import { loadSchemes, type SchemeInfo } from "./schemes.ts"

type DprState = "draft" | "filled" | "sent"

/** Application scheme codes (already applied) and DPR states, per household id. */
async function workFor(householdIds: number[]) {
  const applied = new Map<number, Set<string>>()
  const dpr = new Map<number, Map<string, DprState>>()
  if (!householdIds.length) return { applied, dpr }
  const [apps, drafts] = await Promise.all([
    query<Row>(
      `SELECT a.household_id, s.code FROM tbl_applications a
       JOIN master_schemes s ON s.id = a.scheme_id WHERE a.household_id IN (?)`,
      [householdIds],
    ),
    query<Row>(
      `SELECT d.household_id, s.code, d.status FROM tbl_dpr_drafts d
       JOIN master_schemes s ON s.id = d.scheme_id WHERE d.household_id IN (?)`,
      [householdIds],
    ),
  ])
  for (const a of apps) {
    const set = applied.get(a.household_id) ?? new Set<string>()
    set.add(a.code)
    applied.set(a.household_id, set)
  }
  for (const d of drafts) {
    const map = dpr.get(d.household_id) ?? new Map<string, DprState>()
    map.set(d.code, d.status)
    dpr.set(d.household_id, map)
  }
  return { applied, dpr }
}

/** Recommendations for one household with the scheme details attached. */
export function recommendationsFor(
  h: Household,
  schemes: Map<string, SchemeInfo>,
  applied: ReadonlySet<string>,
  dprStates: ReadonlyMap<string, DprState> = new Map(),
) {
  return recommend(toProfile(h), applied).flatMap((r) => {
    const scheme = schemes.get(r.code)
    if (!scheme) return []
    return [
      {
        ...r,
        name: scheme.name,
        department: scheme.department,
        subsidyPercent: scheme.subsidyPercent,
        maxCost: scheme.maxCost,
        maxSubsidy: Math.round((scheme.maxCost * scheme.subsidyPercent) / 100),
        dpr: dprStates.get(r.code) ?? null,
      },
    ]
  })
}

/** The "completed surveys" list: each surveyed Didi with a summary of what fits her. */
export async function listSurveyed(search: string) {
  const [households, schemes] = await Promise.all([loadSurveyed(search), loadSchemes()])
  const { applied, dpr } = await workFor(households.map((h) => h.id))
  const items = households.map((h) => {
    const recs = recommendationsFor(h, schemes, applied.get(h.id) ?? new Set(), dpr.get(h.id))
    const lev = leverage(h.income, recs)
    return {
      code: h.code,
      name: h.name,
      initials: h.initials,
      village: h.village,
      income: h.income,
      status: h.status,
      statusLabel: h.statusLabel,
      recommended: recs.length,
      topScheme: recs[0]?.name ?? null,
      extraIncome: lev.extra,
      reachesTarget: lev.reachesTarget,
      applied: applied.get(h.id)?.size ?? 0,
    }
  })
  return { total: items.length, items }
}

/** One Didi's personalised recommendations, income impact and open entitlement gaps. */
export async function recommendationsForDidi(code: string) {
  const h = await loadHousehold(code)
  if (!h) throw notFound(msg("परिवार नहीं मिला"))
  const schemes = await loadSchemes()
  const { applied, dpr } = await workFor([h.id])
  const recs = recommendationsFor(h, schemes, applied.get(h.id) ?? new Set(), dpr.get(h.id))
  const lev = leverage(h.income, recs)

  const [gaps, apps] = await Promise.all([
    query<Row>(
      `SELECT g.identified_on, s.code, s.name_hi, s.name_en,
              d.name_hi AS department, d.name_en AS department_en
       FROM tbl_entitlement_gaps g
       JOIN master_schemes s ON s.id = g.scheme_id
       JOIN master_departments d ON d.id = s.department_id
       WHERE g.household_id = ? AND g.status = 'open' ORDER BY g.identified_on DESC`,
      [h.id],
    ),
    query<Row>(
      `SELECT a.app_code, a.status, s.code FROM tbl_applications a
       JOIN master_schemes s ON s.id = a.scheme_id
       WHERE a.household_id = ? ORDER BY a.received_on DESC`,
      [h.id],
    ),
  ])

  return {
    household: {
      code: h.code,
      name: h.name,
      initials: h.initials,
      village: h.village,
      income: h.income,
      status: h.status,
      statusLabel: h.statusLabel,
      category: h.category,
      special: h.special === "NONE" ? null : h.special,
      sources: h.sources,
    },
    leverage: {
      ...lev,
      steps: lev.steps.map((s) => ({ ...s, name: schemes.get(s.code)?.name ?? s.code })),
    },
    recommendations: recs,
    entitlements: gaps.map((g) => ({
      code: g.code as string,
      name: localizedName(g),
      department: localized(g, "department"),
      since: String(g.identified_on).slice(0, 10),
    })),
    applied: apps.map((a) => ({
      id: a.app_code as string,
      status: a.status as string,
      scheme: schemes.get(a.code)?.name ?? a.code,
    })),
  }
}
