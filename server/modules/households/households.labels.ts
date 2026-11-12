export type LifecycleStatus = "in_progress" | "threshold" | "lakhpati" | "single_source" | "gap"

export const lifecycleHi: Record<LifecycleStatus, string> = {
  in_progress: "प्रगति पर",
  threshold: "थ्रेशोल्ड",
  lakhpati: "लखपति",
  single_source: "एकल-स्रोत",
  gap: "गैप",
}

export const categoryHi: Record<string, string> = {
  ST: "ST",
  SC: "SC",
  OBC: "OBC",
  GEN: "सामान्य",
  OTHER: "अन्य",
}

/** Survey answer → stored category code. */
export const categoryCode: Record<string, string> = {
  ST: "ST",
  SC: "SC",
  OBC: "OBC",
  सामान्य: "GEN",
  अन्य: "OTHER",
}

export const LAKHPATI_INCOME = 100_000

/** Lifecycle status from annual net income and number of active sources. */
export function lifecycleFor(income: number, sources: number): LifecycleStatus {
  if (income >= LAKHPATI_INCOME) return "lakhpati"
  if (sources <= 1) return "single_source"
  if (income >= 80_000) return "threshold"
  if (income < 50_000) return "gap"
  return "in_progress"
}
