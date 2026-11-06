import { Router } from "express"

import { query } from "./db/pool.ts"
import { requireAuth } from "./middleware/auth.ts"
import { auditLogsRouter } from "./modules/admin/auditLogs.routes.ts"
import { surveySectionsRouter } from "./modules/admin/surveySections.routes.ts"
import { applicationsRouter } from "./modules/applications/applications.routes.ts"
import { authRouter, publicAuthRouter } from "./modules/auth/auth.routes.ts"
import { geoRouter } from "./modules/geo/geo.routes.ts"
import { householdsRouter } from "./modules/households/households.routes.ts"
import { metaRouter } from "./modules/meta/meta.routes.ts"
import { surveysRouter } from "./modules/surveys/surveys.routes.ts"
import { usersRouter } from "./modules/users/users.routes.ts"
import { HttpError } from "./shared/errors.ts"
import { msg } from "./shared/i18n.ts"

/** All /api routes. Each feature module owns its router. */
export function apiRouter() {
  const api = Router()

  // Public
  api.get("/health", async (_req, res) => {
    await query("SELECT 1")
    res.json({ ok: true })
  })
  api.use("/auth", publicAuthRouter)

  // Signed-in
  api.use(requireAuth)
  api.use("/auth", authRouter)
  api.use("/meta", metaRouter)
  api.use("/geo", geoRouter)
  api.use("/applications", applicationsRouter)
  api.use("/households", householdsRouter)
  api.use("/surveys", surveysRouter)
  api.use("/users", usersRouter)
  api.use("/survey-sections", surveySectionsRouter)
  api.use("/audit-logs", auditLogsRouter)

  api.use((_req, _res, next) => next(new HttpError(404, msg("API endpoint नहीं मिला"))))
  return api
}
