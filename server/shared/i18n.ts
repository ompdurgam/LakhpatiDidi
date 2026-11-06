// Response language for the API. The client sends `Accept-Language: en` in
// English mode; everything else gets Hindi (the source language).
//
// Messages use the same convention as the web app: the Hindi text is the key
// and `messages.en.json` holds the English. Master data (villages, schemes, …)
// comes from the tables' name_en columns instead — see `localized`.
import type { NextFunction, Request, Response } from "express"
import { AsyncLocalStorage } from "node:async_hooks"

import english from "./messages.en.json" with { type: "json" }

export type Lang = "hi" | "en"

const store = new AsyncLocalStorage<Lang>()
const dictionary: Record<string, string> = english

/** Language of the request being handled ("hi" outside a request). */
export const requestLang = (): Lang => store.getStore() ?? "hi"

/** Reads Accept-Language for the rest of the request. */
export function languageMiddleware(req: Request, _res: Response, next: NextFunction) {
  const lang: Lang = /^en\b/i.test(req.get("accept-language") ?? "") ? "en" : "hi"
  store.run(lang, next)
}

/** Runs `fn` as if handling a request in `lang` (tests, background jobs). */
export const withLang = <T>(lang: Lang, fn: () => T) => store.run(lang, fn)

/** Hindi message → the request's language, with {{name}} placeholders filled. */
export function msg(hindi: string, vars?: Record<string, string | number>) {
  const text = requestLang() === "en" ? (dictionary[hindi] ?? hindi) : hindi
  if (!vars) return text
  return text.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

/** A master-table name: `name_hi`, or `name_en` in English (falling back to Hindi when empty). */
export function localizedName(row: Record<string, unknown>, prefix = "name"): string {
  const hindi = (row[`${prefix}_hi`] as string | null) ?? ""
  if (requestLang() !== "en") return hindi
  return (row[`${prefix}_en`] as string | null) || hindi
}

/** `row[column]` in Hindi, or `row[column + "_en"]` in English when it is set. */
export function localized(row: Record<string, unknown>, column: string): string {
  const hindi = (row[column] as string | null) ?? ""
  if (requestLang() !== "en") return hindi
  return (row[`${column}_en`] as string | null) || hindi
}
