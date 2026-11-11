import { useTr } from "@/i18n/tr"

import { money, num } from "../format"
import type { DepartmentRow, Overview } from "../useOverview"

/** Departments ranked by ₹ sanctioned, with speed and on-time rate. */
export function DepartmentLeaderboard({ rows }: { rows: DepartmentRow[] }) {
  const tr = useTr()
  const ranked = [...rows].sort(
    (a, b) => b.sanctionedAmount - a.sanctionedAmount || b.received - a.received,
  )
  return (
    <section className="card department-leaderboard">
      <div className="card-head">
        <div>
          <h3>{tr("विभाग प्रदर्शन लीडरबोर्ड")}</h3>
          <p>{tr("औसत समय, डिलीवरी और अभिसरण")}</p>
        </div>
      </div>
      {ranked.length ? (
        <table>
          <thead>
            <tr>
              <th>{tr("रैंक")}</th>
              <th>{tr("विभाग")}</th>
              <th>{tr("प्राप्त")}</th>
              <th>{tr("औसत स्वीकृति दिन")}</th>
              <th>{tr("समय पर स्वीकृति %")}</th>
              <th>{tr("₹ स्वीकृत")}</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, index) => (
              <tr key={row.code}>
                <td>
                  <b>{index + 1}</b>
                </td>
                <td>{row.name}</td>
                <td>{num(row.received)}</td>
                <td>{row.avgSanctionDays ?? "—"}</td>
                <td>{row.onTimePct === null ? "—" : `${row.onTimePct}%`}</td>
                <td>{money(row.sanctionedAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty-note">{tr("अभी तक किसी विभाग को आवेदन नहीं भेजा गया")}</p>
      )}
    </section>
  )
}

/** Sanctioned / pending / overdue applications for each department × child area. */
export function DepartmentMatrix({ data }: { data: Overview }) {
  const tr = useTr()
  const cells = new Map(data.matrix.map((c) => [`${c.dept}|${c.childId}`, c]))
  const depts = data.departments.filter((d) => data.matrix.some((c) => c.dept === d.code))
  const children = data.children.filter((child) => data.matrix.some((c) => c.childId === child.id))
  return (
    <section className="card district-matrix">
      <div className="card-head">
        <div>
          <h3>{tr("विभागीय अभिसरण मैट्रिक्स")}</h3>
          <p>{tr("विभाग × क्षेत्र")}</p>
        </div>
        <div className="matrix-triple-legend">
          <span>
            <i className="sanctioned" />
            {tr("स्वीकृत")}
          </span>
          <span>
            <i className="pending" />
            {tr("लंबित")}
          </span>
          <span>
            <i className="overdue" />
            {tr("अतिदेय")}
          </span>
        </div>
      </div>
      {depts.length ? (
        <div className="district-matrix-scroll">
          <div className="district-matrix-head">
            <span>{tr("विभाग")}</span>
            {children.map((child) => (
              <b key={child.id}>{child.name}</b>
            ))}
          </div>
          {depts.map((dept) => (
            <div className="district-matrix-row" key={dept.code}>
              <strong>{dept.name}</strong>
              {children.map((child) => {
                const cell = cells.get(`${dept.code}|${child.id}`)
                return (
                  <div key={child.id}>
                    <b>{cell?.sanctioned ?? 0}</b>
                    <em>{cell?.pending ?? 0}</em>
                    <small className={cell?.overdue ? "red" : ""}>{cell?.overdue ?? 0}</small>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-note">{tr("अभी तक कोई आवेदन नहीं")}</p>
      )}
    </section>
  )
}
