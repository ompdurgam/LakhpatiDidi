import type { ApplicationRow } from "@/api/types"
import { num, pct } from "@/features/monitoring/format"
import { useTr } from "@/i18n/tr"

const OPEN = new Set(["submitted", "under_review", "info_requested"])
const SANCTIONED = new Set(["sanctioned", "delivered"])

/** Scheme-wise funnel and pendency for one department, from its applications. */
export function DepartmentAnalytics({ rows }: { rows: ApplicationRow[] }) {
  const tr = useTr()
  const schemes = [...new Set(rows.map((r) => r.scheme))].map((scheme) => {
    const of = rows.filter((r) => r.scheme === scheme)
    return {
      scheme,
      received: of.length,
      sanctioned: of.filter((r) => SANCTIONED.has(r.statusCode)).length,
      delivered: of.filter((r) => r.statusCode === "delivered").length,
      overdue: of.filter((r) => r.overdue).length,
    }
  })
  const open = rows.filter((r) => OPEN.has(r.statusCode))
  const avgPending = open.length ? open.reduce((sum, r) => sum + r.days, 0) / open.length : 0
  const overdue = open.filter((r) => r.overdue).length
  const max = Math.max(1, ...schemes.map((s) => s.received))
  return (
    <section className="analytics-grid department-analytics">
      <div className="card bar-chart">
        <div className="card-head">
          <div>
            <h3>{tr("योजना-वार फनल")}</h3>
            <p>{tr("प्राप्त → स्वीकृत → डिलीवर")}</p>
          </div>
        </div>
        <div className="funnel-legend">
          <span>
            <i className="received" />
            {tr("प्राप्त")}
          </span>
          <span>
            <i className="sanctioned" />
            {tr("स्वीकृत")}
          </span>
          <span>
            <i className="delivered" />
            {tr("डिलीवर")}
          </span>
        </div>
        {schemes.length ? (
          schemes.map((s) => (
            <div className="bar-row" key={s.scheme}>
              <span>
                {s.scheme} • {num(s.received)}
              </span>
              <i>
                <b style={{ width: `${pct(s.received, max)}%` }} />
                <em style={{ width: `${pct(s.sanctioned, max)}%` }} />
                <small style={{ width: `${pct(s.delivered, max)}%` }} />
              </i>
            </div>
          ))
        ) : (
          <p className="empty-note">{tr("अभी तक कोई आवेदन नहीं")}</p>
        )}
      </div>
      <div className="card sla-gauge">
        <h3>{tr("लंबित आवेदनों का औसत समय")}</h3>
        <strong>
          {avgPending.toFixed(1)} <small>{tr("दिन")}</small>
        </strong>
        <div>
          <i />
        </div>
        <p>{tr("{{n}} लंबित • {{o}} अतिदेय", { n: num(open.length), o: num(overdue) })}</p>
      </div>
      <div className="card awareness-gap-card">
        <div className="card-head">
          <div>
            <h3>{tr("योजना-वार अतिदेय")}</h3>
            <p>{tr("SLA समय सीमा पार आवेदन")}</p>
          </div>
        </div>
        {schemes.some((s) => s.overdue) ? (
          schemes
            .filter((s) => s.overdue)
            .map((s) => (
              <div className="awareness-row" key={s.scheme}>
                <strong>{s.scheme}</strong>
                <div>
                  <span>
                    {tr("अतिदेय")} <b>{num(s.overdue)}</b>
                  </span>
                  <i>
                    <em style={{ width: `${pct(s.overdue, s.received)}%` }} />
                  </i>
                </div>
              </div>
            ))
        ) : (
          <p className="empty-note">{tr("कोई आवेदन अतिदेय नहीं है")}</p>
        )}
      </div>
    </section>
  )
}
