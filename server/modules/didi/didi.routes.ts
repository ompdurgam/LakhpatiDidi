import { Router } from "express"
import { z } from "zod"

import { currentUser } from "../../middleware/auth.ts"
import { notFound } from "../../shared/errors.ts"
import { msg } from "../../shared/i18n.ts"
import { parse } from "../../shared/validation.ts"
import { getDidiApplication } from "./didi.applications.ts"
import { answerScheme, getDidiSchemes } from "./didi.schemes.ts"
import { getDidiProfile } from "./didi.service.ts"

/** A Didi's own profile. Scoped by the session's verified mobile — never by a client-supplied id. */
export const didiRouter = Router()

didiRouter.get("/me", async (_req, res) => {
  const profile = await getDidiProfile(currentUser(res).mobile)
  if (!profile) throw notFound(msg("इस मोबाइल नंबर से कोई दीदी प्रोफ़ाइल नहीं जुड़ी है"))
  res.json(profile)
})

/** Schemes recommended to her, with her own answer per scheme. */
didiRouter.get("/me/schemes", async (_req, res) => {
  res.json(await getDidiSchemes(currentUser(res).mobile))
})

/** "Yes, I want to apply" / "Not now" for one recommended scheme. */
didiRouter.post("/me/schemes/:code/interest", async (req, res) => {
  const { code } = parse(
    z.object({
      code: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9_-]{1,30}$/),
    }),
    req.params,
  )
  const { answer } = parse(
    z.object({ answer: z.enum(["yes", "no"], { error: () => msg("अमान्य उत्तर") }) }),
    req.body,
  )
  const user = currentUser(res)
  res.json({ message: await answerScheme(user.mobile, user.id, code, answer) })
})

/** Full detail of one of her own applications (for the detail view and the printable copy). */
didiRouter.get("/me/applications/:code", async (req, res) => {
  res.json(await getDidiApplication(currentUser(res).mobile, String(req.params.code).slice(0, 40)))
})
