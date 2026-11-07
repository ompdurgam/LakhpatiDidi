import { Router } from "express"
import { z } from "zod"

import { currentUser } from "../../middleware/auth.ts"
import { msg } from "../../shared/i18n.ts"
import { parse } from "../../shared/validation.ts"
import { listSurveyed, recommendationsForDidi } from "./recommendations.service.ts"
import { askAboutBestScheme } from "./suggestions.ts"

/** Personalised scheme recommendations for surveyed Didis (surveyor / block view). */
export const recommendationsRouter = Router()

const householdCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{1,30}$/)

recommendationsRouter.get("/", async (req, res) => {
  const { q } = parse(z.object({ q: z.string().trim().max(60).catch("") }), req.query)
  res.json(await listSurveyed(q))
})

recommendationsRouter.get("/:code", async (req, res) => {
  const { code } = parse(z.object({ code: householdCode }), req.params)
  res.json(await recommendationsForDidi(code))
})

/** CRP: "Ask Didi on her phone" about one recommended scheme (or her best fit). */
recommendationsRouter.post("/:code/ask", async (req, res) => {
  const { code } = parse(z.object({ code: householdCode }), req.params)
  const { scheme } = parse(
    z.object({ scheme: z.string().trim().max(30).optional().catch(undefined) }),
    req.body,
  )
  const asked = await askAboutBestScheme(code, { askedBy: currentUser(res).id, schemeCode: scheme })
  res.json({
    asked,
    message: asked
      ? msg("दीदी के फ़ोन पर पूछा गया")
      : msg("दीदी से पूछा नहीं जा सका — लॉगिन नहीं है या पहले पूछा जा चुका है"),
  })
})
