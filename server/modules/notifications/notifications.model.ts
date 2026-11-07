// Pure notification rules: template rendering, per-role links, retry back-off.
// No database access here, so it is unit-tested directly.
import type { Lang } from "../../shared/i18n.ts"
import type { Role } from "../../shared/types.ts"

export type Priority = "low" | "normal" | "high" | "urgent"

/** A row of master_notification_types (the bilingual templates). */
export type NotificationType = {
  id: number
  code: string
  priority: Priority
  title_hi: string
  title_en: string
  body_hi: string
  body_en: string
  push_enabled: number
  ttl_hours: number
  /** JSON list of answer buttons, or null for a plain notice. */
  actions?: string | null
}

/** One answer button of an actionable notice, in the reader's language. */
export type NoticeAction = { id: string; label: string }

/** The answer buttons a notice type offers ([] for plain notices). */
export function actionsFor(raw: string | null | undefined, lang: Lang): NoticeAction[] {
  if (!raw) return []
  try {
    const list = JSON.parse(raw) as { id: string; hi: string; en: string }[]
    return list.map((a) => ({ id: a.id, label: lang === "en" ? a.en : a.hi }))
  } catch {
    return []
  }
}

/** Template parameters. `name_en` overrides `name` in English (Didi names, scheme names). */
export type Payload = Record<string, string | number | null>

/** Fills {{name}} placeholders; English prefers `name_en` when the payload has it. */
export function fill(template: string, payload: Payload, lang: Lang) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = lang === "en" ? (payload[`${name}_en`] ?? payload[name]) : payload[name]
    return value === null || value === undefined ? "" : String(value)
  })
}

/** Title + body of a notice in one language. Rendered when read, never stored as text. */
export function renderNotice(type: NotificationType, payload: Payload, lang: Lang) {
  return {
    title: fill(lang === "en" ? type.title_en : type.title_hi, payload, lang).trim(),
    body: fill(lang === "en" ? type.body_en : type.body_hi, payload, lang)
      .replace(/^\s*•\s*|\s*•\s*$/g, "")
      .trim(),
  }
}

/** The screen an application notice opens for each role. */
export function applicationLink(role: Role, code: string, deptCode: string): string {
  switch (role) {
    case "department":
      return `/dept/${deptCode}/applications/${encodeURIComponent(code)}`
    case "block":
      return "/block/applications"
    case "field":
      return "/field/households"
    case "district":
      return "/district/escalations"
    case "state":
      return "/state/escalations"
    case "didi":
      return "/didi/applications"
    default:
      return "/"
  }
}

/** Minutes to wait before retry n (1-based). After the last one the delivery fails. */
export const RETRY_MINUTES = [1, 5, 30, 120, 720] as const

export function nextRetryMinutes(attemptsSoFar: number): number | null {
  return RETRY_MINUTES[attemptsSoFar - 1] ?? null
}

/** Push service answers that mean "this device is gone for good": drop the subscription. */
export const isGoneStatus = (status: number | undefined) => status === 404 || status === 410

/** Web Push `Urgency` header from the notice priority (lets phones save battery on low ones). */
export const urgencyFor = (priority: Priority): "low" | "normal" | "high" =>
  priority === "urgent" || priority === "high" ? "high" : priority === "low" ? "low" : "normal"
