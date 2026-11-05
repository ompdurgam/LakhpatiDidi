import { z } from "zod"

import { badRequest } from "./errors.ts"

/** Parses request input; the first issue becomes a 400 with its Hindi message. */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input ?? {})
  if (!result.success) throw badRequest(result.error.issues[0]?.message ?? "अमान्य अनुरोध")
  return result.data
}

/** Required, trimmed text with a max length. */
export const text = (field: string, max = 500) =>
  z
    .string({ error: `${field} आवश्यक है` })
    .trim()
    .min(1, `${field} आवश्यक है`)
    .max(max, `${field} बहुत लंबा है`)

/** Indian mobile number; non-digits are stripped first. */
export const mobile = z
  .union([z.string(), z.number()], { error: "मान्य 10-अंकीय मोबाइल नंबर दर्ज करें" })
  .transform((value) => String(value).replace(/\D/g, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "मान्य 10-अंकीय मोबाइल नंबर दर्ज करें"))

export const isoDate = (field: string) =>
  z
    .string({ error: `मान्य ${field} दर्ज करें` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `मान्य ${field} दर्ज करें`)

/** List of codes from a JSON body, capped. */
export const codeList = (max = 200) =>
  z
    .array(z.coerce.string())
    .catch([])
    .transform((codes) => codes.slice(0, max))
