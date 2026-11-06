import { Router } from "express"
import { z } from "zod"

import { currentUser } from "../../middleware/auth.ts"
import { msg } from "../../shared/i18n.ts"
import { mobile, parse, text } from "../../shared/validation.ts"
import { audit } from "../audit/audit.service.ts"
import { createUser, listUsers, resetUserOtp, setUserStatus } from "./users.service.ts"

const ROLES = ["field", "block", "department", "district", "state", "admin"] as const

const createBody = z.object({
  name: text("नाम", 120),
  mobile,
  role: z.enum(ROLES, { error: () => msg("मान्य भूमिका चुनें") }),
  designation: z.string().trim().max(120).optional(),
  block: z.string().trim().optional(),
})
const statusBody = z.object({
  status: z.enum(["active", "locked"], { error: () => msg("मान्य स्थिति चुनें") }),
})
const idParam = z.coerce.number().int().positive()

export const usersRouter = Router()

usersRouter.get("/", async (_req, res) => {
  res.json(await listUsers())
})

usersRouter.post("/", async (req, res) => {
  const input = parse(createBody, req.body)
  const { name, designation } = await createUser(input)
  await audit(req, {
    action: "यूज़र जोड़ा",
    details: `${name} (${designation}) जोड़ा गया`,
    entityType: "user",
    entityId: input.mobile,
  })
  res.status(201).json({ message: msg("{{name}} जोड़ा गया", { name }) })
})

usersRouter.patch("/:id", async (req, res) => {
  const id = parse(idParam, req.params.id)
  const { status } = parse(statusBody, req.body)
  const message = await setUserStatus(id, status, currentUser(res).id)
  await audit(req, {
    action: "यूज़र स्थिति",
    details: message,
    entityType: "user",
    entityId: String(id),
  })
  res.json({ message })
})

usersRouter.post("/:id/otp-reset", async (req, res) => {
  const id = parse(idParam, req.params.id)
  const message = await resetUserOtp(id)
  await audit(req, {
    action: "OTP रीसेट",
    details: message,
    entityType: "user",
    entityId: String(id),
  })
  res.json({ message })
})
