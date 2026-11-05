import type { NextFunction, Request, Response } from "express"

import { HttpError } from "../shared/errors.ts"

const DB_DOWN = ["ECONNREFUSED", "ER_BAD_DB_ERROR", "ER_ACCESS_DENIED_ERROR"]

/** Final error handler: known errors → their status; everything else → 500/503. */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message })
  const err = error as { type?: string; code?: string }
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "अमान्य JSON" })
  console.error(error)
  const dbDown = DB_DOWN.includes(err?.code ?? "")
  res.status(dbDown ? 503 : 500).json({ error: dbDown ? "डेटाबेस उपलब्ध नहीं है" : "सर्वर त्रुटि" })
}
