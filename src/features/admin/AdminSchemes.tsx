import { useState } from "react"

import { useResource } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

type Scheme = {
  code: string
  name: string
  nameHi: string
  nameEn: string
  department: string
  departmentCode: string
  category: string | null
  maxProjectCost: number | null
  subsidyPercent: number | null
  slaDays: number
  active: boolean
  applications: number
}

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`

/** The scheme master (master_schemes): searchable list and the selected scheme's terms. */
export function AdminSchemes() {
  const tr = useTr()
  const { data, loading, error } = useResource<Scheme[]>("/schemes")
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<string>()
  const schemes = data ?? []
  const departments = new Set(schemes.map((s) => s.departmentCode)).size
  const visible = schemes.filter((s) =>
    `${s.name} ${s.nameEn} ${s.code} ${s.department}`.toLowerCase().includes(q.toLowerCase()),
  )
  const scheme = schemes.find((s) => s.code === selected) ?? visible[0]
  return (
    <div className="admin-grid">
      <section className="card scheme-master">
        <div className="card-head">
          <div>
            <h3>{tr("योजनाएँ")}</h3>
            <p>
              {loading
                ? tr("लोड हो रहा है…")
                : tr("{{n}} सक्रिय • {{d}} विभाग", {
                    n: schemes.filter((s) => s.active).length,
                    d: departments,
                  })}
            </p>
          </div>
        </div>
        <label className="admin-search">
          <Icon name="search" size={16} />
          <input
            placeholder={tr("योजना खोजें...")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        {error && <p className="empty-note">{error}</p>}
        {visible.map((s) => (
          <button
            key={s.code}
            className={scheme?.code === s.code ? "active" : ""}
            onClick={() => setSelected(s.code)}
          >
            <span className="scheme-glyph">
              <Icon name="scheme" size={17} />
            </span>
            <div>
              <strong>{s.name}</strong>
              <small>{s.department}</small>
            </div>
            <span className={`status ${s.active ? "green" : "amber"}`}>
              {s.active ? tr("सक्रिय") : tr("निष्क्रिय")}
            </span>
            <Icon name="chevron" size={16} />
          </button>
        ))}
      </section>
      {scheme && (
        <section className="card scheme-editor">
          <div className="card-head">
            <div>
              <h3>{scheme.name}</h3>
              <p>
                {scheme.code} • {tr("{{n}} आवेदन", { n: scheme.applications })}
              </p>
            </div>
          </div>
          <dl className="editor-fields">
            <div>
              <dt>{tr("योजना नाम (हिंदी)")}</dt>
              <dd>{scheme.nameHi}</dd>
            </div>
            <div>
              <dt>{tr("योजना नाम (अंग्रेज़ी)")}</dt>
              <dd>{scheme.nameEn || "—"}</dd>
            </div>
            <div>
              <dt>{tr("विभाग")}</dt>
              <dd>{scheme.department}</dd>
            </div>
            <div>
              <dt>{tr("SLA दिन")}</dt>
              <dd>{scheme.slaDays}</dd>
            </div>
            <div>
              <dt>{tr("अनुदान %")}</dt>
              <dd>{scheme.subsidyPercent === null ? "—" : `${scheme.subsidyPercent}%`}</dd>
            </div>
            <div>
              <dt>{tr("अधिकतम परियोजना लागत")}</dt>
              <dd>{scheme.maxProjectCost === null ? "—" : rupees(scheme.maxProjectCost)}</dd>
            </div>
            <div>
              <dt>{tr("श्रेणी")}</dt>
              <dd>{scheme.category ?? "—"}</dd>
            </div>
          </dl>
          <p className="empty-note">
            {tr("योजना मास्टर में बदलाव डेटाबेस माइग्रेशन से किए जाते हैं।")}
          </p>
        </section>
      )}
    </div>
  )
}
