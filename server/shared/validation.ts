import { z } from "zod"

import { badRequest } from "./errors.ts"
import { msg } from "./i18n.ts"

/** Parses request input; the first issue becomes a 400 with its message (in the request language). */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input ?? {})
  if (!result.success) throw badRequest(result.error.issues[0]?.message ?? msg("अमान्य अनुरोध"))
  return result.data
}

// Messages are functions so they are built per request, in the request's language.
const required = (field: string) => () => msg("{{field}} आवश्यक है", { field: msg(field) })
const invalid = (field: string) => () => msg("मान्य {{field}} दर्ज करें", { field: msg(field) })
const badMobile = () => msg("मान्य 10-अंकीय मोबाइल नंबर दर्ज करें")

/** Required, trimmed text with a max length. */
export const text = (field: string, max = 500) =>
  z
    .string({ error: required(field) })
    .trim()
    .min(1, { error: required(field) })
    .max(max, { error: () => msg("{{field}} बहुत लंबा है", { field: msg(field) }) })

/** Indian mobile number; non-digits are stripped first. */
export const mobile = z
  .union([z.string(), z.number()], { error: badMobile })
  .transform((value) => String(value).replace(/\D/g, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, { error: badMobile }))

export const isoDate = (field: string) =>
  z.string({ error: invalid(field) }).regex(/^\d{4}-\d{2}-\d{2}$/, { error: invalid(field) })

/** List of codes from a JSON body, capped. */
export const codeList = (max = 200) =>
  z
    .array(z.coerce.string())
    .catch([])
    .transform((codes) => codes.slice(0, max))
