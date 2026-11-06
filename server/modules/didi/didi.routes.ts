import { Router } from "express"

import { currentUser } from "../../middleware/auth.ts"
import { notFound } from "../../shared/errors.ts"
import { msg } from "../../shared/i18n.ts"
import { getDidiProfile } from "./didi.service.ts"

/** A Didi's own profile. Scoped by the session's verified mobile — never by a client-supplied id. */
export const didiRouter = Router()

didiRouter.get("/me", async (_req, res) => {
  const profile = await getDidiProfile(currentUser(res).mobile)
  if (!profile) throw notFound(msg("इस मोबाइल नंबर से कोई दीदी प्रोफ़ाइल नहीं जुड़ी है"))
  res.json(profile)
})
