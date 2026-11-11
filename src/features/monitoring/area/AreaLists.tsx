import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { num } from "../format"
import type { Overview } from "../useOverview"

/** Villages where more than half the surveyed PLDs crossed ₹1 lakh. */
export function CandidateVillages({ rows }: { rows: Overview["candidates"] }) {
  const tr = useTr()
  return (
    <div className="card candidate-villages">
      <div className="card-head">
        <div>
          <h3>{tr("लखपति ग्राम संभावित गाँव")}</h3>
          <p>{tr("50% से अधिक सर्वेक्षित PLD ने ₹1 लाख पार किया")}</p>
        </div>
      </div>
      {rows.length ? (
        <div className="candidate-table">
          <div className="head">
            <span>{tr("गाँव")}</span>
            <b>PLD</b>
            <b>{tr("₹1L पार")}</b>
            <span />
          </div>
          {rows.map((row) => (
            <div key={row.code}>
              <strong>
                {row.name}
                <small> • {row.block}</small>
              </strong>
              <b>{num(row.pld)}</b>
              <b>{row.lakhpatiPct}%</b>
              <span />
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-note">{tr("अभी कोई गाँव इस स्तर तक नहीं पहुँचा")}</p>
      )}
    </div>
  )
}

const ESCALATION_LABEL: Record<string, string> = {
  none: "अतिदेय",
  bdo: "BDO स्तर",
  dpm: "DPM स्तर",
  collector: "कलेक्टर स्तर",
}

/** Applications past their SLA, longest overdue first. */
export function Escalations({ rows }: { rows: Overview["escalations"] }) {
  const tr = useTr()
  return (
    <div className="card collector-escalations">
      <div className="card-head">
        <div>
          <h3>{tr("अतिदेय आवेदन")}</h3>
          <p>{tr("SLA समय सीमा पार")}</p>
        </div>
        <span className="count-badge">{rows.length}</span>
      </div>
      {rows.length ? (
        rows.map((row) => (
          <div key={row.code}>
            <span className="gap-icon red">
              <Icon name="alert" size={13} />
            </span>
            <p>
              <strong>
                {row.code} • {row.department}
              </strong>
              <small>
                {row.scheme} • {tr(ESCALATION_LABEL[row.escalation] ?? "अतिदेय")}
              </small>
            </p>
            <b>{tr("{{n}} दिन", { n: row.daysOverdue })}</b>
          </div>
        ))
      ) : (
        <p className="empty-note">{tr("कोई आवेदन अतिदेय नहीं है")}</p>
      )}
    </div>
  )
}
