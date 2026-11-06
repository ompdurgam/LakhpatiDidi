import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { rupees } from "@/lib/money"

import { paybackMonths } from "./finance"
import type { DprData, Money } from "./types"

/** Step 4 — what the project does to her income and how the loan is repaid. */
export function EconomicsStep({ data, money }: { data: DprData; money: Money }) {
  const tr = useTr()
  const { income, gain } = data.economics
  const projected = income + gain
  const payback = paybackMonths(money, gain)
  const goal = projected >= 100_000
  return (
    <div className="dpr-economics">
      <div className="economics-grid">
        <div>
          <span>{tr("वर्तमान वार्षिक आय")}</span>
          <strong>{rupees(income)}</strong>
        </div>
        <div>
          <span>{tr("अपेक्षित अतिरिक्त आय")}</span>
          <strong>+ {rupees(gain)}</strong>
        </div>
        <div className={goal ? "goal" : ""}>
          <span>{tr("परियोजना के बाद")}</span>
          <strong>{rupees(projected)}</strong>
          {goal && <small>{tr("लखपति लक्ष्य हासिल")}</small>}
        </div>
        <div>
          <span>{tr("ब्रेक-ईवन")}</span>
          <strong>{payback === null ? "–" : tr("{{n}} माह", { n: payback })}</strong>
        </div>
      </div>
      <div className="emi-line">
        <span>
          <Icon name="building" size={16} />
        </span>
        <div>
          <strong>{tr("ऋण पुनर्भुगतान")}</strong>
          <small>{tr("{{amount}} ऋण • 36 माह", { amount: rupees(money.bank) })}</small>
        </div>
        <b>
          ~{rupees(money.bank / 36)}/{tr("माह")}
        </b>
      </div>
      <div className="before-after-income">
        <div>
          <span>{tr("पहले")}</span>
          <strong>{rupees(income)}</strong>
        </div>
        <Icon name="arrow" size={18} />
        <div className="after">
          <span>{tr("परियोजना के बाद")}</span>
          <strong>{rupees(projected)}</strong>
          {goal && <small>{tr("लखपति")}</small>}
        </div>
      </div>
    </div>
  )
}
