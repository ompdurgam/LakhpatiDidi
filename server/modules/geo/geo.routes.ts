import { Router } from "express"
import { z } from "zod"

import { msg } from "../../shared/i18n.ts"
import { parse } from "../../shared/validation.ts"
import { GEO_LEVELS } from "./geo.levels.ts"
import { getArea, getVillage } from "./geo.service.ts"

/** Geography explorer: Chhattisgarh → district → block → GP → village (by LGD code). */
export const geoRouter = Router()

const code = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{1,20}$/, { error: () => msg("अमान्य क्षेत्र कोड") })

geoRouter.get("/areas/:level/:code", async (req, res) => {
  const params = parse(
    z.object({
      level: z.enum(GEO_LEVELS, { error: () => msg("अमान्य क्षेत्र स्तर") }),
      code,
    }),
    req.params,
  )
  res.json(await getArea(params.level, params.code))
})

geoRouter.get("/villages/:code", async (req, res) => {
  const params = parse(z.object({ code }), req.params)
  res.json(await getVillage(params.code))
})
