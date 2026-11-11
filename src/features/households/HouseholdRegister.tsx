import { useState } from "react"

import { api } from "@/api/client"
import { useData } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"
import { FilterSelect } from "@/components/ui/Select"
import { HouseholdTracker } from "@/features/households/HouseholdTracker"
import type { HouseholdRecord } from "@/features/households/types"
import { useAreaLabel } from "@/features/monitoring/useAreaLabel"
import { useTr } from "@/i18n/tr"

import { downloadHouseholdsCsv } from "./householdCsv"

/** The API sends at most this many rows (most recent codes first). */
const REGISTER_LIMIT = 5000

export function HouseholdRegister({ onNotify }: { onNotify: (message: string) => void }) {
  const tr = useTr()
  const [selected, setSelected] = useState<string[]>([])
  const [tracker, setTracker] = useState<HouseholdRecord | null>(null)
  const [clf, setClf] = useState("सभी")
  const [vo, setVo] = useState("सभी")
  const [village, setVillage] = useState("सभी")
  const [pld, setPld] = useState("सभी")
  const [incomeBand, setIncomeBand] = useState("सभी")
  const [category, setCategory] = useState("सभी")
  const [special, setSpecial] = useState("सभी")
  const [singleOnly, setSingleOnly] = useState(false)
  const { households, meta, loading } = useData()
  const area = useAreaLabel()
  const visible = households.filter((row) => {
    const clfMatch = clf === "सभी" || row.clf === clf
    const voMatch = vo === "सभी" || row.vo === vo
    const villageMatch = village === "सभी" || row.village === village
    const pldMatch = pld === "सभी" || (pld === "हाँ" && row.pld) || (pld === "नहीं" && !row.pld)
    const incomeMatch =
      incomeBand === "सभी" ||
      (incomeBand === "<50K" && row.income < 50000) ||
      (incomeBand === "50–80K" && row.income >= 50000 && row.income < 80000) ||
      (incomeBand === "80K–1L" && row.income >= 80000 && row.income < 100000) ||
      (incomeBand === "1L+" && row.income >= 100000)
    const categoryMatch = category === "सभी" || row.category === category
    const specialMatch =
      special === "सभी" ||
      (special === "कोई नहीं" && row.special === "—") ||
      row.special === special
    return (
      clfMatch &&
      voMatch &&
      villageMatch &&
      pldMatch &&
      incomeMatch &&
      categoryMatch &&
      specialMatch &&
      (!singleOnly || row.sources < 2)
    )
  })
  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  const bulk = async (action: "assign_crp" | "export" | "reminder") => {
    if (!selected.length) {
      onNotify(tr("पहले परिवार चुनें"))
      return
    }
    try {
      const { message } = await api<{ message: string }>("/households/bulk", {
        body: { codes: selected, action },
      })
      if (action === "export") {
        downloadHouseholdsCsv(households.filter((row) => selected.includes(row.id)))
      }
      onNotify(message)
    } catch (e) {
      onNotify((e as Error).message)
    }
  }
  return (
    <>
      <section className="household-filters-panel card">
        <div className="register-filter-grid">
          <FilterSelect
            label="CLF"
            options={["सभी", ...(meta?.clfs ?? [])]}
            value={clf}
            onChange={setClf}
          />
          <FilterSelect
            label="VO"
            options={["सभी", ...(meta?.vos ?? [])]}
            value={vo}
            onChange={setVo}
          />
          <FilterSelect
            label="गाँव"
            options={["सभी", ...(meta?.villages.map((v) => v.name) ?? [])]}
            value={village}
            onChange={setVillage}
          />
          <FilterSelect
            label="PLD"
            options={["सभी", "हाँ", "नहीं"]}
            value={pld}
            onChange={setPld}
          />
          <FilterSelect
            label="आय बैंड"
            options={["सभी", "<50K", "50–80K", "80K–1L", "1L+"]}
            value={incomeBand}
            onChange={setIncomeBand}
          />
          <FilterSelect
            label="वर्ग"
            options={["सभी", "ST", "SC", "OBC", "सामान्य"]}
            value={category}
            onChange={setCategory}
          />
          <FilterSelect
            label="FRA/PVTG"
            options={["सभी", "FRA", "PVTG", "कोई नहीं"]}
            value={special}
            onChange={setSpecial}
          />
          <label className="single-source-filter">
            <input
              type="checkbox"
              checked={singleOnly}
              onChange={(event) => setSingleOnly(event.target.checked)}
            />
            <span>{tr("एकल-स्रोत")}</span>
          </label>
        </div>
        <div className="bulk-actions">
          <span>
            {selected.length} {tr("चयनित")}
          </span>
          <button onClick={() => bulk("assign_crp")}>
            <Icon name="people" size={15} />
            {tr("CRP को सौंपें")}
          </button>
          <button onClick={() => bulk("export")}>
            <Icon name="download" size={15} />
            {tr("निर्यात")}
          </button>
          <button onClick={() => bulk("reminder")}>
            <Icon name="bell" size={15} />
            {tr("रिमाइंडर भेजें")}
          </button>
        </div>
      </section>
      <section className="card household-register-card">
        <div className="card-head">
          <div>
            <h3>{tr("परिवार और दीदी रजिस्टर")}</h3>
            <p>
              {loading ? tr("लोड हो रहा है…") : tr("{{n}} रिकॉर्ड", { n: visible.length })} • {area}
              {households.length >= REGISTER_LIMIT &&
                ` • ${tr("सबसे हाल के {{n}} दिखाए गए", { n: REGISTER_LIMIT.toLocaleString("en-IN") })}`}
            </p>
          </div>
          <span className="status blue">{tr("PLD रजिस्टर")}</span>
        </div>
        <div className="household-register-scroll">
          <table className="household-register-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={(event) =>
                      setSelected(event.target.checked ? visible.map((row) => row.id) : [])
                    }
                  />
                </th>
                <th>HH ID</th>
                <th>{tr("दीदी")}</th>
                <th>SHG / VO / CLF</th>
                <th>{tr("वर्तमान आय")}</th>
                <th>{tr("सक्रिय स्रोत")}</th>
                <th>{tr("लखपति मीटर")}</th>
                <th>{tr("खुले आवेदन")}</th>
                <th>{tr("हकदारी गैप")}</th>
                <th>{tr("अंतिम अपडेट")}</th>
                <th>{tr("स्थिति")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} onClick={() => setTracker(row)}>
                  <td onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      onChange={() => toggle(row.id)}
                    />
                  </td>
                  <td>
                    <b className="app-id">{tr(row.id)}</b>
                  </td>
                  <td>
                    <div className="register-didi">
                      <span>{tr(row.initials)}</span>
                      <div>
                        <strong>{tr(row.name)}</strong>
                        <small>
                          {tr(row.village)} • {row.category}
                          {row.special !== "—" ? ` • ${row.special}` : ""}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="institution-cell">
                      <strong>{tr(row.shg)}</strong>
                      <span>{tr(row.vo)}</span>
                      <small>{tr(row.clf)}</small>
                    </div>
                  </td>
                  <td>
                    <strong>₹{row.income.toLocaleString("en-IN")}</strong>
                  </td>
                  <td>
                    <span className={row.sources < 2 ? "single-source-count" : ""}>
                      {row.sources}
                    </span>
                  </td>
                  <td>
                    <div className="register-meter">
                      <i>
                        <b
                          style={{
                            width: `${Math.min(row.income / 1000, 100)}%`,
                          }}
                        />
                      </i>
                      <span>{Math.round(row.income / 1000)}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="number-badge blue">{row.applications}</span>
                  </td>
                  <td>
                    <span className={`number-badge ${row.gaps ? "red" : "green"}`}>{row.gaps}</span>
                  </td>
                  <td>{tr(row.updated)}</td>
                  <td>
                    <span
                      className={`status ${
                        row.status === "लखपति"
                          ? "green"
                          : row.status === "गैप"
                            ? "red"
                            : row.status === "एकल-स्रोत"
                              ? "amber"
                              : "blue"
                      }`}
                    >
                      {tr(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <div className="empty">{tr("चुने गए फ़िल्टर में कोई परिवार नहीं मिला")}</div>
          )}
        </div>
      </section>
      {tracker && (
        <>
          <div className="drawer-scrim" onClick={() => setTracker(null)} />
          <aside className="household-tracker-drawer">
            <div className="drawer-head">
              <div>
                <span>{tr("परिवार ट्रैकर")}</span>
                <h2>{tr(tracker.id)}</h2>
              </div>
              <button className="icon-button" onClick={() => setTracker(null)}>
                <Icon name="close" />
              </button>
            </div>
            <HouseholdTracker desktop household={tracker} />
          </aside>
        </>
      )}
    </>
  )
}
