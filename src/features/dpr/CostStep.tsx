import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { rupees } from "@/lib/money"

import { shares } from "./finance"
import type { CostItem, Money } from "./types"

/** Step 3 — editable cost items with the live funding split. */
export function CostStep({
  items,
  setItems,
  money,
  subsidyPercent,
}: {
  items: CostItem[]
  setItems: (items: CostItem[]) => void
  money: Money
  subsidyPercent: number
}) {
  const tr = useTr()
  const pct = shares(money)
  const update = (index: number, patch: Partial<CostItem>) =>
    setItems(items.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  return (
    <div className="cost-finance-layout">
      <div className="cost-table editable">
        <div className="cost-row head">
          <span>{tr("लागत मद")}</span>
          <span>{tr("मात्रा")}</span>
          <span>{tr("राशि")}</span>
        </div>
        {items.map((row, index) => (
          <div className="cost-row" key={index}>
            <input
              value={row.item}
              maxLength={80}
              aria-label={tr("लागत मद")}
              onChange={(event) => update(index, { item: event.target.value })}
            />
            <input
              value={row.quantity}
              maxLength={40}
              aria-label={tr("मात्रा")}
              onChange={(event) => update(index, { quantity: event.target.value })}
            />
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={row.amount}
              aria-label={tr("राशि")}
              onChange={(event) =>
                update(index, { amount: Math.max(0, Number(event.target.value)) })
              }
            />
          </div>
        ))}
        <button
          type="button"
          className="add-cost-item"
          disabled={items.length >= 30}
          onClick={() => setItems([...items, { item: tr("नई लागत मद"), quantity: "1", amount: 0 }])}
        >
          <Icon name="plus" size={14} /> {tr("मद जोड़ें")}
        </button>
        <div className="cost-total">
          <span>{tr("कुल परियोजना लागत")}</span>
          <strong>{rupees(money.total)}</strong>
        </div>
        <div className="finance-chips">
          <span>
            {tr("सब्सिडी")} {subsidyPercent}% • {rupees(money.subsidy)}
          </span>
          <span>
            {tr("बैंक ऋण")} • {rupees(money.bank)}
          </span>
          <span>
            {tr("स्वयं अंश")} • {rupees(money.own)}
          </span>
        </div>
      </div>
      <div className="finance-donut-card">
        <h4>{tr("वित्त के साधन")}</h4>
        <div
          className="finance-donut"
          style={{
            background: `conic-gradient(var(--ld-green-500) 0 ${pct.subsidy}%, #e3aa36 ${pct.subsidy}% ${pct.subsidy + pct.bank}%, #b77a59 ${pct.subsidy + pct.bank}% 100%)`,
          }}
        >
          <span>
            {rupees(money.total)}
            <small>{tr("कुल")}</small>
          </span>
        </div>
        <div className="finance-legend">
          <p>
            <i className="subsidy" />
            <span>
              {tr("सब्सिडी")} {pct.subsidy}%
            </span>
            <strong>{rupees(money.subsidy)}</strong>
          </p>
          <p>
            <i className="bank" />
            <span>
              {tr("बैंक ऋण")} {pct.bank}%
            </span>
            <strong>{rupees(money.bank)}</strong>
          </p>
          <p>
            <i className="own" />
            <span>
              {tr("स्वयं अंश")} {pct.own}%
            </span>
            <strong>{rupees(money.own)}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
