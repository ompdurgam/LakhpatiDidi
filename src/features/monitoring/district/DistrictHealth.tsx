import { useTr } from "@/i18n/tr"

import { money, num, pct } from "../format"
import type { Overview } from "../useOverview"

/** Where surveyed Didis stand on the way to ₹1 lakh. */
function lifecycleParts({ totals }: Overview) {
  const rest = Math.max(
    totals.surveyed - totals.lakhpati - totals.threshold - totals.singleSource,
    0,
  )
  return [
    { label: "लखपति", value: totals.lakhpati, className: "lakhpati" },
    { label: "सीमा के पास", value: totals.threshold, className: "threshold" },
    { label: "एकल आय स्रोत", value: totals.singleSource, className: "single" },
    { label: "प्रगति में", value: rest, className: "rest" },
  ]
}

/** Lifecycle of surveyed Didis, and the district's operational health figures. */
export function DistrictHealth({ data }: { data: Overview }) {
  const tr = useTr()
  const { totals, funnel, gaps, deadlines } = data
  const parts = lifecycleParts(data)
  const stats: [string, string, string, boolean?][] = [
    ["औसत वार्षिक आय", money(totals.avgIncome), "सर्वेक्षित दीदी"],
    [
      "इस माह आय दर्ज",
      num(totals.monthlyUpdated),
      tr("सर्वेक्षित का {{n}}%", { n: pct(totals.monthlyUpdated, totals.surveyed) }),
    ],
    [
      "कुल आवेदन",
      num(funnel.applications),
      tr("{{n}} विभाग सक्रिय", { n: funnel.activeDepartments }),
    ],
    ["अतिदेय आवेदन", num(funnel.overdue), "SLA पार", funnel.overdue > 0],
    ["3 दिन में देय", num(deadlines.dueSoon), "खुले आवेदन", deadlines.dueSoon > 0],
    ["वितरण बाकी", num(deadlines.awaitingDelivery), "स्वीकृत, वितरण शेष"],
    [
      "खुले हकदारी गैप",
      num(gaps.open),
      tr("{{n}}% बंद", { n: pct(gaps.closed, gaps.open + gaps.closed) }),
    ],
    [
      "सक्रिय CRP",
      num(data.surveyors.length),
      tr("{{n}} ड्राफ्ट बाकी", {
        n: num(data.surveyors.reduce((s, c) => s + c.drafts, 0)),
      }),
    ],
    ["लखपति ग्राम संभावित", num(data.candidates.length), "50%+ सर्वेक्षित PLD लखपति"],
  ]
  return (
    <section className="district-health-grid">
      <div className="card lifecycle-card">
        <div className="card-head">
          <div>
            <h3>{tr("दीदी आय स्थिति")}</h3>
            <p>{tr("{{n}} सर्वेक्षित दीदी", { n: num(totals.surveyed) })}</p>
          </div>
        </div>
        {totals.surveyed ? (
          <>
            <div className="lifecycle-bar">
              {parts.map((p) =>
                p.value ? (
                  <b
                    key={p.label}
                    className={p.className}
                    style={{ flexGrow: p.value }}
                    title={`${tr(p.label)}: ${num(p.value)}`}
                  />
                ) : null,
              )}
            </div>
            <div className="lifecycle-legend">
              {parts.map((p) => (
                <span key={p.label}>
                  <i className={p.className} />
                  {tr(p.label)}
                  <strong>{num(p.value)}</strong>
                  <small>{pct(p.value, totals.surveyed)}%</small>
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="empty-note">{tr("अभी तक कोई सर्वे जमा नहीं हुआ है")}</p>
        )}
      </div>
      <div className="district-stat-grid">
        {stats.map(([label, value, meta, alert]) => (
          <div key={label} className="card mini-stat">
            <strong className={alert ? "red-text" : ""}>{value}</strong>
            <span>{tr(label)}</span>
            <small>{tr(meta)}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
