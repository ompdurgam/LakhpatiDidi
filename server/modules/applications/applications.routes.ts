import { Router } from "express"
import { z } from "zod"

import { currentUser } from "../../middleware/auth.ts"
import { codeList, parse, text } from "../../shared/validation.ts"
import { audit } from "../audit/audit.service.ts"
import {
  addComment,
  bulkSanction,
  getApplicationDetail,
  listApplications,
  performAction,
} from "./applications.service.ts"

export const applicationsRouter = Router()

applicationsRouter.get("/", async (_req, res) => {
  res.json(await listApplications())
})

// Registered before "/:code" so "bulk-sanction" isn't read as a code.
applicationsRouter.post("/bulk-sanction", async (req, res) => {
  const { codes } = parse(z.object({ codes: codeList() }), req.body)
  const result = await bulkSanction(codes, currentUser(res).id)
  await audit(req, {
    action: "सामूहिक स्वीकृति",
    details: `${result.sanctioned.length} आवेदन स्वीकृत: ${result.sanctioned.join(", ")}`,
    entityType: "application",
  })
  res.json(result)
})

applicationsRouter.get("/:code", async (req, res) => {
  res.json(await getApplicationDetail(req.params.code))
})

applicationsRouter.post("/:code/actions", async (req, res) => {
  const code = req.params.code
  const message = await performAction(code, req.body ?? {}, currentUser(res).id)
  await audit(req, {
    action: "आवेदन कार्यवाही",
    details: `${code}: ${message}`,
    entityType: "application",
    entityId: code,
  })
  res.json({ message })
})

applicationsRouter.post("/:code/comments", async (req, res) => {
  const { body } = parse(z.object({ body: text("टिप्पणी", 1000) }), req.body)
  await addComment(req.params.code, currentUser(res).id, body)
  res.status(201).json({ ok: true })
})
