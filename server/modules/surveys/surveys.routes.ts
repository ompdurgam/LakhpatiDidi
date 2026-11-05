import { Router } from "express"

import { currentUser } from "../../middleware/auth.ts"
import { dateHi, nowIst } from "../../shared/format.ts"
import { audit } from "../audit/audit.service.ts"
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
  res.status(201).json({ ...result, submittedAt: dateHi(nowIst(), true) })
})
