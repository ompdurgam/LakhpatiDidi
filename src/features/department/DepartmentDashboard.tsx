import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { api } from "@/api/client"
import { useData } from "@/api/hooks"
import type { ApplicationRow } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { departmentByCode, departmentByHindiName, departments } from "@/data/departments"
import { DepartmentInboxTable } from "@/features/department/DepartmentInboxTable"

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
  const { deptCode } = useParams()
  const navigate = useNavigate()
  const dept = (departmentByCode(deptCode) ?? departments[0]).name.hi
  const setDept = (name: string) =>
    navigate(`/dept/${departmentByHindiName(name)?.code ?? departments[0].code}`)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [schemeFilter, setSchemeFilter] = useState("सभी")
  const [blockFilter, setBlockFilter] = useState("सभी")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { meta, refresh } = useData()
  const [bulkBusy, setBulkBusy] = useState(false)
  const fallbackDepartments = [
    "मत्स्य विभाग",
    "कृषि विभाग",
    "उद्यानिकी विभाग",
    "पशुपालन विभाग",
    "वन / CGMFP",
    "महिला एवं बाल विकास",
    "श्रम विभाग",
    "DTIC / उद्योग",
    "रेशम विभाग",
    "हथकरघा विभाग",
    "पर्यटन विभाग",
    "संस्थागत वित्त/बैंक",
    "अंत्यावसायी सहकारी विकास समिति",
    "पंचायत एवं ग्रामीण विकास",
  ]
  const departmentOptions = meta?.departments.map((d) => d.name) ?? fallbackDepartments
  const scopedRows = rows.filter((row) => row.dept === dept)
  const count = (codes: string[]) =>
    scopedRows.filter((row) => codes.includes(row.statusCode)).length
  const sanctionedTotal = scopedRows
    .filter((row) => ["sanctioned", "delivered"].includes(row.statusCode))
    .reduce((sum, row) => sum + Number(row.subsidy.replace(/[^\d]/g, "")), 0)
  const escalations = scopedRows.filter((row) => row.overdue).sort((a, b) => b.days - a.days)
  const bulkSanction = async () => {
    setBulkBusy(true)
    try {
      const result = await api<{ sanctioned: string[]; skipped: string[] }>(
        "/applications/bulk-sanction",
        { body: { codes: selectedIds } },
      )
      const skipped = result.skipped.length
        ? ` • ${result.skipped.length} छोड़े गए (पहले से बंद)`
        : ""
      onNotify(`${result.sanctioned.length} आवेदन स्वीकृत किए गए${skipped}`)
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
      (!overdueOnly || row.days > 15) &&
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
          <span className="eyebrow">लाइन विभाग डैशबोर्ड</span>
          <h2>{dept}</h2>
          <p>जगदलपुर ब्लॉक • सहायक संचालक कार्यालय</p>
        </div>
        <select className="workspace-select" value={dept} onChange={(e) => setDept(e.target.value)}>
          {departmentOptions.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
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
          ["आय सक्रिय लाभार्थी", String(count(["delivered"])), "green"],
        ].map(([label, value, color]) => (
          <div className="card" key={label}>
            <span>{label}</span>
            <strong className={color}>{value}</strong>
            <small>लाइव</small>
          </div>
        ))}
      </section>
      <div className="department-grid enhanced">
        <section className="card department-inbox">
          <div className="card-head">
            <div>
              <h3>आवेदन इनबॉक्स</h3>
              <p>{dept} • केवल इस विभाग के आवेदन</p>
            </div>
            <button
              className="primary bulk-sanction"
              disabled={!selectedIds.length || bulkBusy}
              onClick={bulkSanction}
            >
              <Icon name="check" size={14} /> चयनित स्वीकृत करें
            </button>
          </div>
          <div className="department-filter-row">
            <button
              className={overdueOnly ? "active" : ""}
              onClick={() => setOverdueOnly(!overdueOnly)}
            >
              <Icon name="alert" size={13} /> केवल अतिदेय
            </button>
            <label>
              <span>योजना</span>
              <select
                value={schemeFilter}
                onChange={(event) => setSchemeFilter(event.target.value)}
              >
                {schemeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>ब्लॉक</span>
              <select value={blockFilter} onChange={(event) => setBlockFilter(event.target.value)}>
                {["सभी", ...(meta?.blocks.map((b) => b.name) ?? [])].map((option) => (
                  <option key={option}>{option}</option>
                ))}
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
              <h3>एस्केलेशन</h3>
              <p>आपकी कार्यवाही अपेक्षित</p>
            </div>
            <span className="count-badge">{escalations.length}</span>
          </div>
          {escalations.length === 0 && (
            <p className="empty-note">इस विभाग में कोई अतिदेय आवेदन नहीं</p>
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
                <strong>{x.id}</strong>
                <span>
                  {x.name} • {x.scheme}
                </span>
                <small>
                  {x.block} • प्राप्ति {x.received}
                </small>
              </div>
              <b>{x.days} दिन अतिदेय</b>
            </div>
          ))}
          {escalations[0] && (
            <button className="primary" onClick={() => onSelect(escalations[0])}>
              प्रतिक्रिया दर्ज करें
            </button>
          )}
        </section>
      </div>
      <DepartmentAnalytics />
    </div>
  )
}
