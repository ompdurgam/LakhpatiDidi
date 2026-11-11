import { Router } from "express"
import { z } from "zod"

import { query } from "../../db/pool.ts"
import { currentUser } from "../../middleware/auth.ts"
import { badRequest } from "../../shared/errors.ts"
import { formatDate, initials } from "../../shared/format.ts"
import { localized, msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { codeList, parse } from "../../shared/validation.ts"
import { audit } from "../audit/audit.service.ts"
import { sessionCondition } from "../auth/assignments.ts"
import { invalidateVillageStats } from "../monitoring/monitoring.area.ts"
import { householdCode } from "../surveys/surveys.schemas.ts"
import { categoryHi, lifecycleHi, type LifecycleStatus } from "./households.labels.ts"
import { addMonthlyIncome, getTracker } from "./households.tracker.ts"

const toHouseholdRow = (r: Row) => ({
  id: r.hh_code,
  name: localized(r, "didi_name"),
  initials: initials(r.didi_name_en, r.didi_name),
  village: localized(r, "village_name"),
  shg: r.shg_name ?? "—",
  vo: r.vo_name ?? "—",
  clf: r.clf_name ?? "—",
  income: Number(r.current_annual_income),
  sources: Number(r.active_income_sources),
  applications: Number(r.open_applications),
  gaps: Number(r.open_gaps),
  updated: formatDate(r.updated_at),
  status: msg(lifecycleHi[r.lifecycle_status as LifecycleStatus]),
  category: msg(categoryHi[r.social_category]),
  special: r.special_status === "NONE" ? "—" : r.special_status,
  pld: Boolean(r.is_pld),
})

const bulkActions = {
  assign_crp: "CRP को सौंपा गया",
  export: "निर्यात किया गया",
  reminder: "रिमाइंडर भेजा गया",
} as const

const bulkBody = z.object({
  codes: codeList(1000),
  action: z.enum(Object.keys(bulkActions) as [keyof typeof bulkActions], {
    error: () => msg("अज्ञात कार्यवाही"),
  }),
})

export const householdsRouter = Router()

const AREA_JOIN = `JOIN master_villages v         ON v.id  = h.village_id
  JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
  JOIN master_blocks b           ON b.id  = gp.block_id`

/** At most this many register rows per request (a district holds up to ~50,000 Didis). */
const REGISTER_LIMIT = 5000

/** The register for the session's areas (the whole state for statewide roles), most recent first, capped. */
householdsRouter.get("/", async (_req, res) => {
  const area = await sessionCondition(currentUser(res))
  const rows = await query<Row>(
    // Pick the ids first (index on hh_code), then read only those rows from the view.
    `SELECT r.* FROM v_household_register r
     JOIN (SELECT h.id FROM tbl_households h ${area ? `${AREA_JOIN} WHERE ${area.sql}` : ""}
           ORDER BY h.hh_code DESC LIMIT ${REGISTER_LIMIT}) pick ON pick.id = r.id
     ORDER BY r.hh_code DESC`,
    area?.params ?? [],
  )
  res.json(rows.map(toHouseholdRow))
})

householdsRouter.post("/bulk", async (req, res) => {
  const { codes, action } = parse(bulkBody, req.body)
  if (!codes.length) throw badRequest(msg("कोई परिवार नहीं चुना गया"))
  const label = bulkActions[action]
  const sample = `${codes.slice(0, 5).join(", ")}${codes.length > 5 ? "…" : ""}`
  await audit(req, {
    action: "परिवार कार्यवाही",
    details: `${codes.length} परिवार: ${label} (${sample})`,
    entityType: "household",
  })
  res.json({ message: msg("{{n}} परिवार: {{action}}", { n: codes.length, action: msg(label) }) })
})

/** One Didi's journey, applications, gaps and monthly income. */
householdsRouter.get("/:code/tracker", async (req, res) => {
  const { code } = parse(z.object({ code: householdCode }), req.params)
  res.json(await getTracker(code))
})

/** Records this month's income from one source. */
householdsRouter.post("/:code/income", async (req, res) => {
  const { code } = parse(z.object({ code: householdCode }), req.params)
  await addMonthlyIncome(code, req.body, currentUser(res).id)
  invalidateVillageStats()
  await audit(req, {
    action: "मासिक आय दर्ज",
    details: `${code}: ${String(req.body?.source)} ₹${Number(req.body?.amount)}`,
    entityType: "household",
    entityId: code,
  })
  res.status(201).json({ message: msg("आय दर्ज हुई") })
})
