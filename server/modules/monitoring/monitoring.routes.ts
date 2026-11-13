import { Router } from "express"
import { z } from "zod"

import { currentUser } from "../../middleware/auth.ts"
import { msg } from "../../shared/i18n.ts"
import { parse } from "../../shared/validation.ts"
import { schemeConvergence } from "./monitoring.applications.ts"
import { resolveArea } from "./monitoring.area.ts"
import { overview } from "./monitoring.service.ts"
import { areaTrend } from "./monitoring.trend.ts"

/** Block / district / state dashboards, computed from live data within the user's area. */
export const monitoringRouter = Router()

/** Optional `?level=&code=` naming an area inside the user's own. */
const areaQuery = z.object({
  level: z.enum(["state", "district", "block"]).optional(),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{1,20}$/, { error: () => msg("अमान्य क्षेत्र कोड") })
    .optional(),
})

const requestedArea = (q: z.infer<typeof areaQuery>) =>
  q.level && q.code ? { level: q.level, code: q.code } : undefined

monitoringRouter.get("/overview", async (req, res) => {
  const query = parse(
    areaQuery.extend({ escalations: z.coerce.number().int().min(1).max(200).catch(8) }),
    req.query,
  )
  res.json(await overview(currentUser(res), requestedArea(query), query.escalations))
})

/** Scheme-wise convergence for the user's area (or a named area inside it). */
monitoringRouter.get("/schemes", async (req, res) => {
  const query = parse(areaQuery, req.query)
  res.json(await schemeConvergence(await resolveArea(currentUser(res), requestedArea(query))))
})

/** Month-by-month activity for the user's area (or a named area inside it). */
monitoringRouter.get("/trend", async (req, res) => {
  const query = parse(
    areaQuery.extend({ months: z.coerce.number().int().min(3).max(24).catch(12) }),
    req.query,
  )
  const area = await resolveArea(currentUser(res), requestedArea(query))
  res.json(await areaTrend(area, query.months))
})
