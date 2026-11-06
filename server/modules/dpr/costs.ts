// Default cost items for a DPR and how a project is financed. Pure, so it can be tested.
import { msg } from "../../shared/i18n.ts"

export type CostItem = { item: string; quantity: string; amount: number }

type Template = [item: string, quantity: string, share: number][]

/** Typical cost breakdown per scheme, as shares of the project cost (each sums to 1). */
const templates = (): Record<string, Template> => {
  const pond: Template = [
    [msg("तालाब तैयारी"), "1", 0.25],
    [msg("फिंगरलिंग बीज"), "5,000", 0.2],
    [msg("मछली आहार"), msg("12 माह"), 0.35],
    [msg("जाल और उपकरण"), msg("1 सेट"), 0.2],
  ]
  const enterprise: Template = [
    [msg("मशीनरी / उपकरण"), msg("1 सेट"), 0.5],
    [msg("कच्चा माल"), msg("3 माह"), 0.3],
    [msg("कार्यशील पूँजी"), "1", 0.2],
  ]
  return {
    AH_POULTRY: [
      [msg("चूजे / पक्षी"), msg("100 इकाई"), 0.35],
      [msg("मुर्गी शेड"), "1", 0.3],
      [msg("दाना और दवा"), msg("6 माह"), 0.25],
      [msg("टीकाकरण / अन्य"), "1", 0.1],
    ],
    AH_GOAT: [
      [msg("बकरियाँ"), "10 + 1", 0.55],
      [msg("शेड"), "1", 0.25],
      [msg("चारा और दवा"), msg("12 माह"), 0.15],
      [msg("बीमा / अन्य"), "1", 0.05],
    ],
    FISH_OWNPOND: pond,
    PMMSY_POND: pond,
    FISH_BOATNET: [
      [msg("नाव"), "1", 0.55],
      [msg("जाल"), msg("2 सेट"), 0.35],
      [msg("आइस बॉक्स"), "1", 0.1],
    ],
    LAC: [
      [msg("ब्रूड लाख / पौधे"), msg("1 सेट"), 0.5],
      [msg("उपकरण"), msg("1 सेट"), 0.3],
      [msg("प्रशिक्षण"), "1", 0.2],
    ],
    VANDHAN: [
      [msg("संग्रहण उपकरण"), msg("1 सेट"), 0.4],
      [msg("प्रसंस्करण इकाई"), "1", 0.4],
      [msg("पैकेजिंग"), "1", 0.2],
    ],
    NHM_MICRO: [
      [msg("ड्रिप / स्प्रिंकलर सेट"), msg("1.5 एकड़"), 0.7],
      [msg("पंप सेट"), "1", 0.2],
      [msg("स्थापना"), "1", 0.1],
    ],
    MUDRA: enterprise,
    PMEGP: enterprise,
    TRIBAL_SELF: enterprise,
    HANDLOOM_SHED: [
      [msg("वर्कशेड"), "1", 0.6],
      [msg("करघा / उपकरण"), msg("1 सेट"), 0.4],
    ],
    SERI_TRAIN: [
      [msg("प्रशिक्षण शुल्क"), "1", 0.6],
      [msg("किट"), "1", 0.4],
    ],
    CG_HOMESTAY: [
      [msg("कमरे / मरम्मत"), msg("2 कमरे"), 0.6],
      [msg("फर्नीचर और बिस्तर"), msg("1 सेट"), 0.3],
      [msg("साइनेज और मार्केटिंग"), "1", 0.1],
    ],
  }
}

const roundTo = (n: number, to: number) => Math.round(n / to) * to

/** A sensible starting project cost: 80% of the scheme's cap, in whole thousands. */
export const defaultProjectCost = (maxCost: number) =>
  maxCost > 0 ? Math.max(1000, roundTo(maxCost * 0.8, 1000)) : 100_000

/** The scheme's typical cost items at the given total; the last item absorbs rounding. */
export function defaultCostItems(code: string, total: number): CostItem[] {
  const template = templates()[code] ?? [[msg("परियोजना मद"), "1", 1]]
  let used = 0
  return template.map(([item, quantity, share], index) => {
    const amount = index === template.length - 1 ? total - used : roundTo(total * share, 100)
    used += amount
    return { item, quantity, amount }
  })
}

export const totalOf = (items: readonly Pick<CostItem, "amount">[]) =>
  items.reduce((sum, i) => sum + i.amount, 0)

/**
 * Subsidy is `percent` of the project cost up to the scheme's cap; the rest is split
 * 75% bank loan / 25% own share (60% subsidy → 30% / 10%, as in the standard DPR).
 */
export function financing(total: number, subsidyPercent: number, maxCost: number) {
  const base = maxCost > 0 ? Math.min(total, maxCost) : total
  const subsidy = Math.min(total, Math.round((base * subsidyPercent) / 100))
  const rest = total - subsidy
  const bank = Math.round(rest * 0.75)
  return { total, subsidy, bank, own: rest - bank }
}

/** Months for the extra income to repay the money the Didi puts in (loan + own share). */
export const paybackMonths = (financed: { bank: number; own: number }, annualGain: number) =>
  annualGain > 0 ? Math.ceil((financed.bank + financed.own) / (annualGain / 12)) : null
