import type { CostItem, Money } from "./types"

export const totalOf = (items: readonly Pick<CostItem, "amount">[]) =>
  items.reduce((sum, i) => sum + (Number.isFinite(i.amount) ? i.amount : 0), 0)

/** Mirrors the server's split so the figures update while she edits: subsidy, then 75% bank / 25% own. */
export function financing(total: number, subsidyPercent: number, maxCost: number): Money {
  const base = maxCost > 0 ? Math.min(total, maxCost) : total
  const subsidy = Math.min(total, Math.round((base * subsidyPercent) / 100))
  const rest = total - subsidy
  const bank = Math.round(rest * 0.75)
  return { total, subsidy, bank, own: rest - bank }
}

/** Months for the extra income to repay what she puts in (loan + own share). */
export const paybackMonths = (money: Money, annualGain: number) =>
  annualGain > 0 ? Math.ceil((money.bank + money.own) / (annualGain / 12)) : null

/** Share (%) of each funding source, for the donut. */
export const shares = (money: Money) => {
  if (money.total <= 0) return { subsidy: 0, bank: 0, own: 0 }
  const subsidy = Math.round((money.subsidy / money.total) * 100)
  const bank = Math.round((money.bank / money.total) * 100)
  return { subsidy, bank, own: Math.max(0, 100 - subsidy - bank) }
}
