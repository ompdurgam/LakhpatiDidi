import { Router } from "express"
import { z } from "zod"

import { bearerToken, currentUser } from "../../middleware/auth.ts"
import { mobile, parse } from "../../shared/validation.ts"
import { audit } from "../audit/audit.service.ts"
import { requestOtp, revokeSession, toPublicUser, verifyOtp } from "./auth.service.ts"

const otpBody = z.object({ mobile })
const verifyBody = z.object({ mobile, otp: z.coerce.string().catch("") })

/** Public endpoints (no session needed). */
export const publicAuthRouter = Router()

publicAuthRouter.post("/otp", async (req, res) => {
  const { mobile } = parse(otpBody, req.body)
  res.json(await requestOtp(mobile))
})

publicAuthRouter.post("/verify", async (req, res) => {
  const { mobile, otp } = parse(verifyBody, req.body)
  const { token, user } = await verifyOtp(mobile, otp)
  res.locals.user = user
  await audit(req, {
    action: "लॉगिन",
    details: `${user.name} ने OTP से लॉगिन किया`,
    entityType: "user",
    entityId: String(user.id),
  })
  res.json({ token, user: toPublicUser(user) })
})

/** Endpoints for a signed-in user. */
export const authRouter = Router()

authRouter.get("/me", (_req, res) => {
  res.json({ user: toPublicUser(currentUser(res)) })
})

authRouter.post("/logout", async (req, res) => {
  await revokeSession(bearerToken(req))
  res.json({ ok: true })
})
