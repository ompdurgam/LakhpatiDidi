import { useTr } from "@/i18n/tr"

import { num, pct } from "../format"
import type { Overview } from "../useOverview"

/** Didis at each stage from survey to Lakhpati (each a count of households). */
function funnelStages({ totals, funnel }: Overview): [string, number][] {
  return [
    ["सर्वे", totals.surveyed],
    ["सुझाव", funnel.asked],
    ["सहमति", funnel.interested],
    ["DPR", funnel.dpr],
    ["स्वीकृत", funnel.sanctioned],
    ["वितरित", funnel.delivered],
    ["आय सक्रिय", funnel.incomeActive],
    ["लखपति", totals.lakhpati],
  ]
}

export function StatewideFunnel({ data }: { data: Overview }) {
  const tr = useTr()
  const stages = funnelStages(data)
  const top = stages[0][1]
  return (
    <div className="card statewide-funnel">
      <div className="card-head">
        <div>
          <h3>{tr("लखपति फनल")}</h3>
          <p>{tr("सर्वे से लखपति तक")}</p>
        </div>
      </div>
      {top === 0 && <p className="empty-note">{tr("अभी तक कोई सर्वे जमा नहीं हुआ है")}</p>}
      {stages.map(([label, value], index) => {
        const next = stages[index + 1]?.[1]
        return (
          <div key={label}>
            <span>{tr(label)}</span>
            <i>
              <b style={{ width: `${Math.max(pct(value, top), value ? 4 : 0)}%` }}>{num(value)}</b>
            </i>
            <small>
              {next === undefined ? tr("लक्ष्य") : tr("{{n}}% अगला चरण", { n: pct(next, value) })}
            </small>
          </div>
        )
      })}
    </div>
  )
}
