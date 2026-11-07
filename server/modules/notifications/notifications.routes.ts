import { Router } from "express"
import { z } from "zod"

import { currentUser } from "../../middleware/auth.ts"
import { notFound } from "../../shared/errors.ts"
import { msg, requestLang } from "../../shared/i18n.ts"
import { parse } from "../../shared/validation.ts"
import { respondAsUser, respondWithToken } from "./notifications.actions.ts"
import { getInbox } from "./notifications.inbox.ts"
import * as repo from "./notifications.repository.ts"
import { vapidPublicKey } from "./push.ts"

/** The signed-in user's own notifications and devices (every role, Didi included). */
export const notificationsRouter = Router()

const pageQuery = z.object({
  before: z.coerce.number().int().positive().optional().catch(undefined),
  limit: z.coerce.number().int().min(1).max(50).catch(20),
  unread: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
})

notificationsRouter.get("/", async (req, res) => {
  const q = parse(pageQuery, req.query)
  res.json(
    await getInbox(currentUser(res).id, { before: q.before, limit: q.limit, unreadOnly: q.unread }),
  )
})

notificationsRouter.get("/unread-count", async (_req, res) => {
  res.json({ unread: await repo.unreadCount(currentUser(res).id) })
})

const readBody = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.coerce.number().int().positive()).min(1).max(200) }),
])

notificationsRouter.post("/read", async (req, res) => {
  const body = parse(readBody, req.body)
  const userId = currentUser(res).id
  await repo.markRead(userId, "all" in body ? "all" : body.ids)
  res.json({ unread: await repo.unreadCount(userId) })
})

const answerBody = z.object({ answer: z.string().trim().min(1).max(20) })

/** In-app answer to an actionable notice. */
notificationsRouter.post("/:id/respond", async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) throw notFound(msg("सूचना नहीं मिली"))
  const { answer } = parse(answerBody, req.body)
  res.json({ response: await respondAsUser(currentUser(res).id, id, answer) })
})

/**
 * Answer from a phone notification button (no session in the service worker).
 * Public: the single-use push token is the credential.
 */
export const publicNotificationsRouter = Router()

publicNotificationsRouter.post("/answer", async (req, res) => {
  const { token, answer } = parse(
    answerBody.extend({ token: z.string().min(20).max(100) }),
    req.body,
  )
  res.json({ response: await respondWithToken(token, answer) })
})

notificationsRouter.post("/:id/archive", async (req, res) => {
  const id = Number(req.params.id)
  const userId = currentUser(res).id
  if (!Number.isInteger(id) || !(await repo.archive(userId, id)))
    throw notFound(msg("सूचना नहीं मिली"))
  res.json({ unread: await repo.unreadCount(userId) })
})

// ---- Web Push devices ----

notificationsRouter.get("/push/key", (_req, res) => {
  res.json({ publicKey: vapidPublicKey() })
})

const subscriptionBody = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(2000),
  keys: z.object({ p256dh: z.string().min(16).max(255), auth: z.string().min(8).max(64) }),
})

notificationsRouter.post("/push/subscriptions", async (req, res) => {
  const { endpoint, keys } = parse(subscriptionBody, req.body)
  await repo.upsertSubscription(currentUser(res).id, {
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    lang: requestLang(),
    userAgent: req.get("user-agent")?.slice(0, 255) ?? null,
  })
  res.status(201).json({ ok: true })
})

notificationsRouter.delete("/push/subscriptions", async (req, res) => {
  const { endpoint } = parse(z.object({ endpoint: z.string().min(1).max(2000) }), req.body)
  await repo.revokeSubscription(currentUser(res).id, endpoint)
  res.json({ ok: true })
})
