import { useTr } from "@/i18n/tr"
import { rupees } from "@/lib/money"

import type { CostItem, DprData, Money } from "./types"

/** Step 7 — the DPR as it will be sent. */
export function PreviewStep({
  data,
  items,
  money,
  documents,
  remarks,
}: {
  data: DprData
  items: CostItem[]
  money: Money
  documents: string[]
  remarks: string
}) {
  const tr = useTr()
  const h = data.household
  const gain = data.economics.gain
  return (
    <div className="pdf-preview detailed-pdf">
      <div className="pdf-sheet">
        <div className="pdf-head">
          <span>{tr("महिला लखपति कार्यक्रम – CGSRLM")}</span>
          <strong>{tr("विस्तृत परियोजना प्रतिवेदन")}</strong>
          <small>{data.scheme.name}</small>
        </div>
        <div className="pdf-recipient">
          <strong>{tr("प्राप्तकर्ता:")}</strong> {data.scheme.office}
        </div>
        <div className="pdf-person">
          <div className="didi-photo">{h.initials}</div>
          <p>
            <b>{h.name}</b>
            <br />
            {h.code}
            <br />
            {h.village}, GP {h.panchayat}, {h.block}, {h.district}
          </p>
        </div>
        <div className="pdf-cost-table">
          <div>
            <b>{tr("लागत मद")}</b>
            <b>{tr("राशि")}</b>
          </div>
          {items.map((row, index) => (
            <div key={index}>
              <span>
                {row.item} ({row.quantity})
              </span>
              <strong>{rupees(row.amount)}</strong>
            </div>
          ))}
          <div className="total">
            <b>{tr("कुल परियोजना लागत")}</b>
            <b>{rupees(money.total)}</b>
          </div>
        </div>
        <p className="pdf-finance">
          {tr("सब्सिडी")} {rupees(money.subsidy)} • {tr("बैंक ऋण")} {rupees(money.bank)} •{" "}
          {tr("स्वयं अंश")} {rupees(money.own)}
        </p>
        <div className="pdf-income-projection">
          <span>
            {tr("वर्तमान आय")} <b>{rupees(h.income)}</b>
          </span>
          <i>→</i>
          <span>
            {tr("परियोजना के बाद")} <b>{rupees(h.income + gain)}</b>
          </span>
          <strong>
            +{rupees(gain)}/{tr("वर्ष")}
          </strong>
        </div>
        <div className="pdf-checklist">
          <h4>{tr("दस्तावेज़ चेकलिस्ट")}</h4>
          {data.fit.docs.map((doc) => (
            <span key={doc}>
              {documents.includes(doc) ? "✓" : "○"} {doc}
            </span>
          ))}
        </div>
        {remarks && (
          <p className="pdf-declaration">
            <b>{tr("सत्यापन टिप्पणी")}:</b> {remarks}
          </p>
        )}
      </div>
    </div>
  )
}
