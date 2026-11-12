import { Router } from "express"
import { z } from "zod"

import { currentUser } from "../../middleware/auth.ts"
import { msg } from "../../shared/i18n.ts"
import { parse } from "../../shared/validation.ts"
import { schemeConvergence } from "./monitoring.applications.ts"
import { resolveArea } from "./monitoring.area.ts"
import { overview } from "./monitoring.service.ts"

/** Block / district / state dashboards, computed from live data within the user's area. */
export const monitoringRouter = Router()

monitoringRouter.get("/overview", async (req, res) => {
  const query = parse(
    z.object({
      level: z.enum(["state", "district", "block"]).optional(),
      code: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9-]{1,20}$/, { error: () => msg("अमान्य क्षेत्र कोड") })
        .optional(),
      escalations: z.coerce.number().int().min(1).max(200).catch(8),
    }),
    req.query,
  )
  const requested = query.level && query.code ? { level: query.level, code: query.code } : undefined
  res.json(await overview(currentUser(res), requested, query.escalations))
})

/** Scheme-wise convergence for the user's own area. */
monitoringRouter.get("/schemes", async (_req, res) => {
  res.json(await schemeConvergence(await resolveArea(currentUser(res))))
})
