import { Router } from "express"

import { currentUser } from "../../middleware/auth.ts"
import { formatDate, nowIst } from "../../shared/format.ts"
import { audit } from "../audit/audit.service.ts"
import { askAboutBestScheme } from "../recommendations/suggestions.ts"
import { submitSurvey } from "./surveys.service.ts"

export const surveysRouter = Router()

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
