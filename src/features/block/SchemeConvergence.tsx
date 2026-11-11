import { useQuery } from "@tanstack/react-query"

import { api } from "@/api/client"
import { EmptyState } from "@/components/ui/EmptyState"
import { money, num, pct } from "@/features/monitoring/format"
import { useTr } from "@/i18n/tr"
import { useSession } from "@/stores/session"

type SchemeRow = {
  code: string
  name: string
  department: string
  asked: number
  interested: number
  dpr: number
  sanctioned: number
  delivered: number
  sanctionedAmount: number
  gapsOpen: number
  gapsClosed: number
}

/** Scheme-wise progress from suggestion to delivery, and entitlement gaps, for the user's area. */
export function SchemeConvergence() {
  const tr = useTr()
  const signedIn = useSession((s) => Boolean(s.token))
  const { data, isLoading, error } = useQuery({
    queryKey: ["monitoring", "schemes"],
    queryFn: () => api<SchemeRow[]>("/monitoring/schemes"),
    enabled: signedIn,
  })
  if (isLoading) return <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>
  if (error || !data) return <EmptyState>{error?.message ?? tr("डेटा नहीं मिला")}</EmptyState>
  const withGaps = data.filter((r) => r.gapsOpen + r.gapsClosed > 0)
  return (
    <div className="scheme-convergence-page">
      <section className="card convergence-table-card">
        <div className="card-head">
          <div>
            <h3>{tr("योजना अभिसरण")}</h3>
            <p>{tr("सुझाव से वितरण तक")}</p>
          </div>
        </div>
        {data.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{tr("योजना")}</th>
                  <th>{tr("विभाग")}</th>
                  <th>{tr("सुझाए")}</th>
                  <th>{tr("सहमति")}</th>
                  <th>DPR</th>
                  <th>{tr("स्वीकृत")}</th>
                  <th>{tr("वितरित")}</th>
                  <th>{tr("₹ स्वीकृत")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.code}>
                    <td>
                      <strong>{row.name}</strong>
                    </td>
                    <td>{row.department}</td>
                    <td>{num(row.asked)}</td>
                    <td>{num(row.interested)}</td>
                    <td>{num(row.dpr)}</td>
                    <td>{num(row.sanctioned)}</td>
                    <td>{num(row.delivered)}</td>
                    <td>
                      <strong>{money(row.sanctionedAmount)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-note">{tr("अभी तक किसी योजना पर कोई गतिविधि नहीं")}</p>
        )}
      </section>
      <section className="card block-awareness-chart">
        <div className="card-head">
          <div>
            <h3>{tr("हकदारी गैप")}</h3>
            <p>{tr("सर्वे में पात्र पर लाभ न पाने वाले परिवार • बंद गैप का अनुपात")}</p>
          </div>
        </div>
        {withGaps.length ? (
          withGaps.map((row) => {
            const total = row.gapsOpen + row.gapsClosed
            return (
              <div key={row.code}>
                <strong>{row.name}</strong>
                <span>{tr("{{n}} खुले", { n: num(row.gapsOpen) })}</span>
                <i>
                  <b className="aware" style={{ width: "100%" }} />
                  <b className="benefit" style={{ width: `${pct(row.gapsClosed, total)}%` }} />
                </i>
                <small>{tr("{{n}}% बंद", { n: pct(row.gapsClosed, total) })}</small>
              </div>
            )
          })
        ) : (
          <p className="empty-note">{tr("सर्वे में अभी कोई हकदारी गैप दर्ज नहीं")}</p>
        )}
      </section>
    </div>
  )
}
