import { Router } from "express"
import { z } from "zod"

import { parse } from "../../shared/validation.ts"
import { listSurveyed, recommendationsForDidi } from "./recommendations.service.ts"

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
