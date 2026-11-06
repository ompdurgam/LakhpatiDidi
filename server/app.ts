import express from "express"
import fs from "node:fs"
import path from "node:path"

import { config } from "./config.ts"
import { errorHandler } from "./middleware/errorHandler.ts"
import { apiRouter } from "./routes.ts"
import { languageMiddleware } from "./shared/i18n.ts"

/** Builds the Express app (no listening — see index.ts). */
export function createApp() {
  const app = express()
  app.set("trust proxy", "loopback")
  app.use(express.json({ limit: config.jsonLimit }))
  app.use(languageMiddleware)
  app.use("/api", apiRouter())

  // Production: serve the built PWA from the same origin.
  const dist = path.resolve(import.meta.dirname, "..", "dist")
  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { index: false }))
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")))
  }

  app.use(errorHandler)
  return app
}
