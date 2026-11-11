import { Router } from "express"
import { z } from "zod"

import { currentUser } from "../../middleware/auth.ts"
import { notFound } from "../../shared/errors.ts"
import { formatDate, nowIst } from "../../shared/format.ts"
import { msg } from "../../shared/i18n.ts"
import { parse } from "../../shared/validation.ts"
import { audit } from "../audit/audit.service.ts"
import { askAboutBestScheme } from "../recommendations/suggestions.ts"
import { householdForSurvey, listForSurvey } from "./surveyList.ts"
import { householdCode } from "./surveys.schemas.ts"
import { submitSurvey } from "./surveys.service.ts"

export const surveysRouter = Router()

/** Didis on record in the surveyor's area, paged; pending (not yet surveyed) by default. */
surveysRouter.get("/households", async (req, res) => {
  const opts = parse(
    z.object({
      q: z.string().trim().max(60).catch(""),
      status: z.enum(["pending", "done", "all"]).catch("pending"),
      page: z.coerce.number().int().min(0).max(100_000).catch(0),
    }),
    req.query,
  )
  res.json(await listForSurvey(currentUser(res).id, opts))
})

/** One Didi's record, used to prefill her survey. */
surveysRouter.get("/households/:code", async (req, res) => {
  const { code } = parse(z.object({ code: householdCode }), req.params)
  const household = await householdForSurvey(currentUser(res).id, code)
  if (!household) throw notFound(msg("परिवार नहीं मिला"))
  res.json(household)
})

surveysRouter.post("/", async (req, res) => {
  const result = await submitSurvey(req.body, currentUser(res).id)
  await audit(req, {
    action: "सर्वे जमा",
    details: `${result.hhCode} • ${result.name} (${result.created ? "नया परिवार" : "अपडेट"})`,
    entityType: "household",
    entityId: result.hhCode,
  })
  // After the survey is saved: ask the Didi on her phone about the scheme that fits her best.
  // A failure here must never fail the survey itself.
  await askAboutBestScheme(result.hhCode, { askedBy: currentUser(res).id }).catch((error) =>
    console.error("scheme suggestion:", error),
  )
  res.status(201).json({ ...result, submittedAt: formatDate(nowIst(), true) })
})
