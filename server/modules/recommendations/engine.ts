// Ranks the scheme rules for one Didi and shows what taking them up does to her income.
import { LAKHPATI_INCOME } from "../households/households.labels.ts"
import { rules } from "./schemeRules.ts"
import type { Profile, Recommendation, SourceKind } from "./types.ts"

/** Survey income-source names → the kind of livelihood they are. */
const KIND_BY_SOURCE: Record<string, SourceKind> = {
  "फसल/खेती": "farming",
  "अन्य कृषि/बागवानी": "horticulture",
  पशुपालन: "livestock",
  "मत्स्य पालन": "fisheries",
  "वन उपज": "forest",
  "गैर-कृषि उद्यम": "nonfarm",
  पर्यटन: "tourism",
  "स्थानीय मजदूरी": "wage",
  "प्रवासन/रोजगार": "migration",
}

export const sourceKind = (name: string): SourceKind => KIND_BY_SOURCE[name] ?? "other"

/** Scores below this are not worth showing. */
const MIN_SCORE = 45
const MAX_SCORE = 98
const MAX_RESULTS = 8
/** A scheme that by itself lifts her to Lakhpati is worth a little more. */
const LAKHPATI_BONUS = 6

/**
 * Schemes that fit this Didi, best first. `applied` holds the scheme codes she has
 * already applied for; those are left out.
 */
export function recommend(
  profile: Profile,
  applied: ReadonlySet<string> = new Set(),
): Recommendation[] {
  const out: Recommendation[] = []
  for (const rule of rules) {
    if (applied.has(rule.code)) continue
    const fit = rule.fit(profile)
    if (!fit) continue
    const bonus = profile.income + rule.gain >= LAKHPATI_INCOME ? LAKHPATI_BONUS : 0
    const score = Math.min(MAX_SCORE, fit.score + bonus)
    if (score >= MIN_SCORE) out.push({ ...fit, score, code: rule.code, gain: rule.gain })
  }
  return out.sort((a, b) => b.score - a.score || b.gain - a.gain).slice(0, MAX_RESULTS)
}

/** Income today, with her best three schemes, and against the ₹1 lakh target. */
export function leverage(income: number, recs: Pick<Recommendation, "code" | "gain">[]) {
  const top = recs.slice(0, 3)
  const extra = top.reduce((sum, r) => sum + r.gain, 0)
  const projected = income + extra
  return {
    current: income,
    target: LAKHPATI_INCOME,
    extra,
    projected,
    reachesTarget: projected >= LAKHPATI_INCOME,
    steps: top.map((r) => ({ code: r.code, gain: r.gain })),
  }
}
