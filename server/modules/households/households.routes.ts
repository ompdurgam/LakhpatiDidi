import { Router } from "express"
import { z } from "zod"

import { query } from "../../db/pool.ts"
import { badRequest } from "../../shared/errors.ts"
import { formatDate, initials } from "../../shared/format.ts"
import { localized, msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { codeList, parse } from "../../shared/validation.ts"
import { audit } from "../audit/audit.service.ts"
import { categoryHi, lifecycleHi, type LifecycleStatus } from "./households.labels.ts"

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

householdsRouter.get("/", async (_req, res) => {
  const rows = await query<Row>("SELECT * FROM v_household_register ORDER BY hh_code DESC")
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
