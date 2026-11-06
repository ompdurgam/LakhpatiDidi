import { Router } from "express"
import { z } from "zod"

import { exec, one, query } from "../../db/pool.ts"
import { badRequest, notFound } from "../../shared/errors.ts"
import { msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { parse } from "../../shared/validation.ts"
import { audit } from "../audit/audit.service.ts"

/** Section A (identification) is always on. */
const LOCKED_SECTION = "A"

export const surveySectionsRouter = Router()

surveySectionsRouter.get("/", async (_req, res) => {
  const rows = await query<Row>(
    "SELECT code, name_hi AS name, is_enabled FROM master_survey_sections ORDER BY sort_order",
  )
  res.json(rows.map((r) => ({ code: r.code, name: r.name, enabled: Boolean(r.is_enabled) })))
})

surveySectionsRouter.patch("/:code", async (req, res) => {
  const { code } = req.params
  const { enabled } = parse(z.object({ enabled: z.unknown().transform(Boolean) }), req.body)
  if (code === LOCKED_SECTION && !enabled)
    throw badRequest(msg("पहचान सेक्शन (A) बंद नहीं किया जा सकता"))
  const section = await one<Row>("SELECT name_hi FROM master_survey_sections WHERE code = ?", [
    code,
  ])
  if (!section) throw notFound(msg("सेक्शन नहीं मिला"))
  await exec("UPDATE master_survey_sections SET is_enabled = ? WHERE code = ?", [enabled, code])
  // The audit log keeps the Hindi record; the response follows the request language.
  const record = `${code} ${section.name_hi} सेक्शन ${enabled ? "चालू" : "बंद"} किया`
  await audit(req, {
    action: "फॉर्म सेटिंग",
    details: record,
    entityType: "survey",
    entityId: code,
  })
  res.json({
    message: enabled
      ? msg("{{code}} {{name}} सेक्शन चालू किया", { code, name: msg(section.name_hi) })
      : msg("{{code}} {{name}} सेक्शन बंद किया", { code, name: msg(section.name_hi) }),
  })
})
