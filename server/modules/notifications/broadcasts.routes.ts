import { Router } from "express"
import { z } from "zod"

import { currentUser } from "../../middleware/auth.ts"
import { msg } from "../../shared/i18n.ts"
import { parse, text } from "../../shared/validation.ts"
import { audit } from "../audit/audit.service.ts"
import {
  composerOptions,
  countAudience,
  listSent,
  loadSender,
  sendBroadcast,
} from "./broadcasts.service.ts"

/** Custom notices a staff member sends to the people below them (/api/broadcasts). */
export const broadcastsRouter = Router()

const roleList = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : value.split(",")).filter(Boolean))
  .pipe(z.array(z.string().max(20)).max(10))

const areaId = z.coerce.number().int().positive().nullish().catch(null)

broadcastsRouter.get("/options", async (_req, res) => {
  const { sender } = await loadSender(currentUser(res).id)
  res.json(await composerOptions(sender))
})

broadcastsRouter.get("/audience", async (req, res) => {
  const q = parse(z.object({ roles: roleList.catch([]), area: areaId }), req.query)
  const { sender } = await loadSender(currentUser(res).id)
  res.json(await countAudience(sender, q.roles, q.area))
})

broadcastsRouter.get("/", async (_req, res) => {
  res.json(await listSent(currentUser(res).id))
})

const sendBody = z.object({
  roles: roleList,
  area: areaId,
  title: text("शीर्षक", 80),
  body: text("संदेश", 300),
})

broadcastsRouter.post("/", async (req, res) => {
  const input = parse(sendBody, req.body)
  const author = await loadSender(currentUser(res).id)
  const sent = await sendBroadcast(author, {
    roles: input.roles,
    areaId: input.area,
    title: input.title,
    body: input.body,
  })
  await audit(req, {
    action: "सूचना भेजी",
    details: `"${input.title}" → ${input.roles.join(", ")} (${sent.people})`,
    entityType: "notification",
    entityId: String(sent.id),
  })
  res
    .status(201)
    .json({ ...sent, message: msg("सूचना {{n}} लोगों को भेजी गई", { n: sent.people }) })
})
