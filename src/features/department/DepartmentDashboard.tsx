import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { api } from "@/api/client"
import { useData } from "@/api/hooks"
import type { ApplicationRow } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { departmentByCode, departments } from "@/data/departments"
import { DepartmentInboxTable } from "@/features/department/DepartmentInboxTable"
import { useAreaLabel } from "@/features/monitoring/useAreaLabel"
import { useTr } from "@/i18n/tr"
import { useSession } from "@/stores/session"

import { DepartmentAnalytics } from "./DepartmentAnalytics"

export function DepartmentWorkspace({
  rows,
  onSelect,
  onNotify,
}: {
  rows: ApplicationRow[]
  onSelect: (item: ApplicationRow) => void
  onNotify: (message: string) => void
}) {
  const tr = useTr()
  const { deptCode } = useParams()
  const navigate = useNavigate()
  // A department officer works only in her own department(s); others may open any.
  const session = useSession((s) => s.user)
  const role = useSession((s) => s.role)
  const ownCodes = new Set(
    (session?.assignments ?? [])
      .filter((a) => a.role === "department" && a.departmentCode)
      .map((a) => a.departmentCode),
  )
  const allowed =
    role === "department" && ownCodes.size
      ? departments.filter((d) => ownCodes.has(d.code))
      : departments
  const current = allowed.find((d) => d.code === departmentByCode(deptCode)?.code) ?? allowed[0]
  const dept = current.name.hi
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [schemeFilter, setSchemeFilter] = useState("सभी")
  const [blockFilter, setBlockFilter] = useState("सभी")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { meta, refresh } = useData()
  const area = useAreaLabel()
  const [bulkBusy, setBulkBusy] = useState(false)
  // Matched on the department code (names differ between Hindi and English).
  const scopedRows = rows.filter((row) => row.deptCode === current.code)
  const count = (codes: string[]) =>
    scopedRows.filter((row) => codes.includes(row.statusCode)).length
  // What was actually sanctioned (the requested subsidy until an amount is recorded).
  const sanctionedTotal = scopedRows
    .filter((row) => ["sanctioned", "delivered"].includes(row.statusCode))
    .reduce((sum, row) => sum + (row.sanctionedAmount ?? row.subsidyAmount), 0)
  const escalations = scopedRows
    .filter((row) => row.overdue)
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
  const bulkSanction = async () => {
    setBulkBusy(true)
    try {
      const result = await api<{ sanctioned: string[]; skipped: string[] }>(
        "/applications/bulk-sanction",
        { body: { codes: selectedIds } },
      )
      const skipped = result.skipped.length
        ? tr(" • {{n}} छोड़े गए (पहले से बंद)", { n: result.skipped.length })
        : ""
      onNotify(tr("{{n}} आवेदन स्वीकृत किए गए", { n: result.sanctioned.length }) + skipped)
      setSelectedIds([])
      await refresh()
    } catch (e) {
      onNotify((e as Error).message)
    } finally {
      setBulkBusy(false)
    }
  }
  const schemeOptions = ["सभी", ...Array.from(new Set(scopedRows.map((row) => row.scheme)))]
  const filteredRows = scopedRows.filter(
    (row) =>
      (!overdueOnly || row.overdue) &&
      (schemeFilter === "सभी" || row.scheme === schemeFilter) &&
      (blockFilter === "सभी" || row.block === blockFilter),
  )
  const toggleSelected = (id: string) =>
    setSelectedIds(
      selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id],
    )
  return (
    <div className="page role-page">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">{tr("लाइन विभाग डैशबोर्ड")}</span>
          <h2>{tr(dept)}</h2>
          <p>{area}</p>
        </div>
        {allowed.length > 1 && (
          <select
            className="workspace-select"
            value={current.code}
            onChange={(e) => navigate(`/dept/${e.target.value}`)}
          >
            {allowed.map((d) => (
              <option key={d.code} value={d.code}>
                {tr(d.name.hi)}
              </option>
            ))}
          </select>
        )}
      </div>
      <section className="department-kpis">
        {[
          ["प्राप्त", String(scopedRows.length), "blue"],
          ["समीक्षाधीन", String(count(["submitted", "under_review", "info_requested"])), "amber"],
          ["स्वीकृत", String(count(["sanctioned"])), "green"],
          ["डिलीवर", String(count(["delivered"])), "green"],
          ["अस्वीकृत", String(count(["rejected"])), "red"],
          ["अतिदेय", String(escalations.length), "red"],
          ["स्वीकृत राशि", `₹${sanctionedTotal.toLocaleString("en-IN")}`, "green"],
          ["आय सक्रिय लाभार्थी", String(scopedRows.filter((r) => r.incomeActive).length), "green"],
        ].map(([label, value, color]) => (
          <div className="card" key={label}>
            <span>{tr(label)}</span>
            <strong className={color}>{tr(value)}</strong>
            <small>{tr("लाइव")}</small>
          </div>
        ))}
      </section>
      <div className="department-grid enhanced">
        <section className="card department-inbox">
          <div className="card-head">
            <div>
              <h3>{tr("आवेदन इनबॉक्स")}</h3>
              <p>
                {tr(dept)} {tr("• केवल इस विभाग के आवेदन")}
              </p>
            </div>
            <button
              className="primary bulk-sanction"
              disabled={!selectedIds.length || bulkBusy}
              onClick={bulkSanction}
            >
              <Icon name="check" size={14} /> {tr("चयनित स्वीकृत करें")}
            </button>
          </div>
          <div className="department-filter-row">
            <button
              className={overdueOnly ? "active" : ""}
              onClick={() => setOverdueOnly(!overdueOnly)}
            >
              <Icon name="alert" size={13} /> {tr("केवल अतिदेय")}
            </button>
            <label>
              <span>{tr("योजना")}</span>
              <select
                value={schemeFilter}
                onChange={(event) => setSchemeFilter(event.target.value)}
              >
                {schemeOptions.map((option) => (
                  <option key={option} value={option}>
                    {tr(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{tr("ब्लॉक")}</span>
              <select value={blockFilter} onChange={(event) => setBlockFilter(event.target.value)}>
                {["सभी", ...(meta?.blocks.filter((b) => b.active).map((b) => b.name) ?? [])].map(
                  (option, index) => (
                    <option key={`${index}-${option}`} value={option}>
                      {tr(option)}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          <DepartmentInboxTable
            rows={filteredRows}
            selected={selectedIds}
            onToggle={toggleSelected}
            onSelect={onSelect}
          />
        </section>
        <section className="card escalation-panel">
          <div className="card-head">
            <div>
              <h3>{tr("एस्केलेशन")}</h3>
              <p>{tr("आपकी कार्यवाही अपेक्षित")}</p>
            </div>
            <span className="count-badge">{escalations.length}</span>
          </div>
          {escalations.length === 0 && (
            <p className="empty-note">{tr("इस विभाग में कोई अतिदेय आवेदन नहीं")}</p>
          )}
          {escalations.slice(0, 4).map((x, index) => (
            <div
              className="escalation enriched clickable"
              key={x.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(x)}
              onKeyDown={(event) => event.key === "Enter" && onSelect(x)}
            >
              <i className={index === 0 ? "red" : "amber"} />
              <div>
                <strong>{tr(x.id)}</strong>
                <span>
                  {tr(x.name)} • {tr(x.scheme)}
                </span>
                <small>
                  {tr(x.block)} {tr("• प्राप्ति")} {tr(x.received)}
                </small>
              </div>
              <b>
                {x.daysOverdue} {tr("दिन अतिदेय")}
              </b>
            </div>
          ))}
          {escalations[0] && (
            <button className="primary" onClick={() => onSelect(escalations[0])}>
              {tr("प्रतिक्रिया दर्ज करें")}
            </button>
          )}
        </section>
      </div>
      <DepartmentAnalytics rows={scopedRows} />
    </div>
  )
}
