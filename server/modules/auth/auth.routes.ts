import { Router } from "express"
import { z } from "zod"

import { bearerToken, currentUser } from "../../middleware/auth.ts"
import { mobile, parse } from "../../shared/validation.ts"
import { audit } from "../audit/audit.service.ts"
import { requestOtp, revokeSession, switchRole, toPublicUser, verifyOtp } from "./auth.service.ts"

const otpBody = z.object({ mobile })
const verifyBody = z.object({
  mobile,
  otp: z.coerce.string().catch(""),
  role: z.string().max(20).optional(),
})

/** Public endpoints (no session needed). */
export const publicAuthRouter = Router()

publicAuthRouter.post("/otp", async (req, res) => {
  const { mobile } = parse(otpBody, req.body)
  res.json(await requestOtp(mobile))
})

publicAuthRouter.post("/verify", async (req, res) => {
  const { mobile, otp, role } = parse(verifyBody, req.body)
  const { token, user } = await verifyOtp(mobile, otp, role)
  res.locals.user = user
  await audit(req, {
    action: "लॉगिन",
    details: `${user.name} ने OTP से लॉगिन किया`,
    entityType: "user",
    entityId: String(user.id),
  })
  res.json({ token, user: await toPublicUser(user) })
})

/** Endpoints for a signed-in user. */
export const authRouter = Router()

authRouter.get("/me", async (_req, res) => {
  res.json({ user: await toPublicUser(currentUser(res)) })
})

/** Switches this session to another of the user's own roles. */
authRouter.post("/role", async (req, res) => {
  const { role } = parse(z.object({ role: z.string().max(20) }), req.body)
  res.json({ user: await switchRole(bearerToken(req), currentUser(res), role) })
})

authRouter.post("/logout", async (req, res) => {
  await revokeSession(bearerToken(req))
  res.json({ ok: true })
})
