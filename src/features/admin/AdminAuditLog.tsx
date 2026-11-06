import { useState } from "react"

import { useResource } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function AdminAuditLog() {
  const tr = useTr()
  const {
    data: rows,
    error,
    loading,
    reload,
  } = useResource<
    { id: number; at: string; user: string; action: string; details: string; ip: string }[]
  >("/audit-logs")
  const [actionFilter, setActionFilter] = useState("सभी")
  const actions = ["सभी", ...Array.from(new Set((rows ?? []).map((r) => r.action)))]
  const visible = (rows ?? []).filter((r) => actionFilter === "सभी" || r.action === actionFilter)
  return (
    <section className="card admin-data-table audit-log">
      <div className="card-head">
        <div>
          <h3>{tr("ऑडिट लॉग")}</h3>
          <p>
            {tr("सिस्टम और कॉन्फ़िगरेशन बदलाव •")} {visible.length} {tr("प्रविष्टियाँ")}
          </p>
        </div>
        <div className="audit-tools">
          <label className="filter-button">
            <Icon name="filter" size={14} />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label={tr("क्रिया फ़िल्टर")}
            >
              {actions.map((a) => (
                <option key={a} value={a}>
                  {tr(a)}
                </option>
              ))}
            </select>
          </label>
          <button className="filter-button" onClick={reload} disabled={loading}>
            <Icon name="clock" size={14} /> {tr("रीफ़्रेश")}
          </button>
        </div>
      </div>
      {error && <p className="form-error">{tr(error)}</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{tr("समय")}</th>
              <th>{tr("यूज़र")}</th>
              <th>{tr("क्रिया")}</th>
              <th>{tr("विवरण")}</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td>{tr(row.at)}</td>
                <td>{tr(row.user)}</td>
                <td>{tr(row.action)}</td>
                <td>{tr(row.details)}</td>
                <td>{tr(row.ip)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows && !error && <div className="empty">{tr("लोड हो रहा है…")}</div>}
      </div>
    </section>
  )
}
