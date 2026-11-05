import { z } from "zod"

import { mobile, text } from "../../shared/validation.ts"

export const incomeEntry = z.object({
  name: z.coerce.string().transform((s) => s.slice(0, 80)),
  months: z.array(z.string()).catch([]),
  gross: z.coerce.number().catch(0),
  cost: z.coerce.number().catch(0),
})
export type IncomeEntry = z.infer<typeof incomeEntry>

/** Labels of the survey fields that map onto household columns. */
export const FIELD = {
  name: "SHG सदस्य का नाम",
  mobile: "मोबाइल (10 अंक)",
  age: "आयु",
  guardian: "माता-पिता/पति का नाम",
  village: "गाँव",
  shg: "SHG नाम",
  category: "सामाजिक वर्ग",
} as const

export const surveyBody = z.object({
  responses: z.record(z.string(), z.coerce.string()).catch({}),
  incomeEntries: z.array(incomeEntry).catch([]),
  sections: z
    .array(z.string())
    .catch([])
    .transform((s) => (s.length ? s.join("").slice(0, 30) : "ABCDEFGHIJK")),
  consentMethod: z.enum(["OTP", "thumb", "sign"]).catch("OTP"),
})

/** Household fields extracted from the free-form responses. */
export const householdFields = z.object({
  [FIELD.name]: text(FIELD.name, 120),
  // Empty means "not given"; anything else must be a valid mobile.
  [FIELD.mobile]: z.preprocess((v) => (v === "" ? undefined : v), mobile.optional()),
  [FIELD.age]: z.coerce.number().int().positive().max(120).optional().catch(undefined),
  [FIELD.guardian]: z.string().trim().optional().catch(undefined),
  [FIELD.village]: z.string().trim().min(1).catch("बड़ांजी"),
  [FIELD.shg]: z.string().trim().optional().catch(undefined),
  [FIELD.category]: z.string().optional().catch(undefined),
})
