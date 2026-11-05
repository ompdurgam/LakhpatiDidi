import { useState } from "react"

import { useResource } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"

export function AdminAuditLog() {
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
          <h3>ऑडिट लॉग</h3>
          <p>सिस्टम और कॉन्फ़िगरेशन बदलाव • {visible.length} प्रविष्टियाँ</p>
        </div>
        <div className="audit-tools">
          <label className="filter-button">
            <Icon name="filter" size={14} />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="क्रिया फ़िल्टर"
            >
              {actions.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <button className="filter-button" onClick={reload} disabled={loading}>
            <Icon name="clock" size={14} /> रीफ़्रेश
          </button>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>समय</th>
              <th>यूज़र</th>
              <th>क्रिया</th>
              <th>विवरण</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td>{row.at}</td>
                <td>{row.user}</td>
                <td>{row.action}</td>
                <td>{row.details}</td>
                <td>{row.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows && !error && <div className="empty">लोड हो रहा है…</div>}
      </div>
    </section>
  )
}
