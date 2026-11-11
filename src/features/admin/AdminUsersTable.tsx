import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export type AdminUserRow = {
  id: number
  name: string
  mobile: string
  role: string
  designation: string
  district: string | null
  block: string | null
  village: string | null
  department: string | null
  status: "active" | "locked"
  createdAt: string
  lastLogin: string | null
  assignments: {
    role: string
    level: string
    areaCode: string | null
    areaName: string
    departmentCode: string | null
    departmentName: string | null
    path: { district?: string; block?: string; gram_panchayat?: string; village?: string }
  }[]
}

const ROLE_TABS: [string, string][] = [
  ["all", "सभी"],
  ["admin", "एडमिन"],
  ["state", "राज्य (SMMU)"],
  ["district", "जिला (DPM)"],
  ["department", "विभाग"],
  ["block", "ब्लॉक"],
  ["field", "CRP / सर्वेयर"],
  ["didi", "दीदी"],
]

const hasRole = (u: AdminUserRow, role: string) =>
  u.assignments.some((a) => a.role === role) || u.role === role

const roleLabel = Object.fromEntries(ROLE_TABS)

/** Every account with its full mobile and placement, filterable by role and searchable. */
export function AdminUsersTable({
  users,
  busy,
  onToggle,
  onReset,
  onEdit,
}: {
  users: AdminUserRow[]
  busy: boolean
  onToggle: (row: AdminUserRow) => void
  onReset: (row: AdminUserRow) => void
  onEdit: (row: AdminUserRow) => void
}) {
  const tr = useTr()
  const [role, setRole] = useState("all")
  const [q, setQ] = useState("")
  const count = (key: string) =>
    key === "all" ? users.length : users.filter((u) => hasRole(u, key)).length
  const needle = q.trim().toLowerCase()
  const visible = users.filter(
    (u) =>
      (role === "all" || hasRole(u, role)) &&
      (!needle ||
        [u.name, u.mobile, u.designation, ...u.assignments.map((a) => a.areaName)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))),
  )
  return (
    <>
      <div className="admin-tabs">
        {ROLE_TABS.filter(([key]) => key === "all" || count(key) > 0).map(([key, label]) => (
          <button key={key} className={role === key ? "active" : ""} onClick={() => setRole(key)}>
            {tr(label)} ({count(key)})
          </button>
        ))}
      </div>
      <label className="admin-search">
        <Icon name="search" size={16} />
        <input
          placeholder={tr("नाम, मोबाइल या क्षेत्र खोजें")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{tr("नाम")}</th>
              <th>{tr("मोबाइल")}</th>
              <th>{tr("पदनाम")}</th>
              <th>{tr("भूमिकाएँ और कार्यक्षेत्र")}</th>
              <th>{tr("स्थिति")}</th>
              <th>{tr("खाता बना")}</th>
              <th>{tr("अंतिम लॉगिन")}</th>
              <th>{tr("रीसेट")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{tr(row.name)}</strong>
                </td>
                <td>
                  <a href={`tel:+91${row.mobile}`}>{row.mobile}</a>
                </td>
                <td>{tr(row.designation)}</td>
                <td>
                  <div className="assignment-chips">
                    {row.assignments.map((a, i) => (
                      <span key={i}>
                        {tr(roleLabel[a.role] ?? a.role)} • {a.areaName}
                        {a.departmentName ? ` • ${a.departmentName}` : ""}
                      </span>
                    ))}
                  </div>
                  <button className="text-button" disabled={busy} onClick={() => onEdit(row)}>
                    {tr("बदलें")}
                  </button>
                </td>
                <td>
                  <button
                    className={`status ${row.status === "active" ? "green" : "red"} status-toggle`}
                    disabled={busy}
                    title={tr("स्थिति बदलें")}
                    onClick={() => onToggle(row)}
                  >
                    {row.status === "active" ? tr("सक्रिय") : tr("लॉक")}
                  </button>
                </td>
                <td>{row.createdAt}</td>
                <td>{row.lastLogin ?? tr("कभी नहीं")}</td>
                <td>
                  <button className="table-reset" disabled={busy} onClick={() => onReset(row)}>
                    {tr("OTP रीसेट")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <div className="empty">{tr("कोई यूज़र नहीं मिला")}</div>}
      </div>
    </>
  )
}
