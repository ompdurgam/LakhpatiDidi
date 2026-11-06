import { Router } from "express"
import { z } from "zod"

import { currentUser } from "../../middleware/auth.ts"
import { msg } from "../../shared/i18n.ts"
import { parse, text } from "../../shared/validation.ts"
import { audit } from "../audit/audit.service.ts"
import { dprBoard } from "./dpr.board.ts"
import { getDpr, saveDpr, sendDpr } from "./dpr.service.ts"

/** DPRs: the board (KPIs + list), one DPR's draft, saving it, and sending it as an application. */
export const dprRouter = Router()

const code = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{1,30}$/, { error: () => msg("अमान्य कोड") })
const params = z.object({ code, scheme: code })

const money = z.coerce
  .number({ error: () => msg("राशि संख्या में दर्ज करें") })
  .finite()
  .min(0, { error: () => msg("राशि शून्य से कम नहीं हो सकती") })
  .max(10_000_000, { error: () => msg("राशि बहुत अधिक है") })

const saveBody = z.object({
  step: z.coerce.number().int().min(1).max(7),
  items: z
    .array(
      z.object({
        item: text("लागत मद", 80),
        quantity: z.string().trim().max(30).catch(""),
        amount: money,
      }),
    )
    .min(1, { error: () => msg("कम से कम एक लागत मद चाहिए") })
    .max(30),
  remarks: z.string().trim().max(500).catch(""),
  documents: z.array(z.string().trim().max(80)).max(30).catch([]),
})

dprRouter.get("/", async (req, res) => {
  const { q } = parse(z.object({ q: z.string().trim().max(60).catch("") }), req.query)
  res.json(await dprBoard(q))
})

dprRouter.get("/:code/:scheme", async (req, res) => {
  const p = parse(params, req.params)
  res.json(await getDpr(p.code, p.scheme))
})

dprRouter.put("/:code/:scheme", async (req, res) => {
  const p = parse(params, req.params)
  const input = parse(saveBody, req.body)
  res.json(await saveDpr(p.code, p.scheme, input, currentUser(res).id))
})

dprRouter.post("/:code/:scheme/send", async (req, res) => {
  const p = parse(params, req.params)
  const result = await sendDpr(p.code, p.scheme, currentUser(res).id)
  await audit(req, {
    action: "DPR भेजा",
    details: `${result.applicationCode} • ${p.code} • ${p.scheme}`,
    entityType: "application",
    entityId: result.applicationCode,
  })
  res.status(201).json(result)
})
