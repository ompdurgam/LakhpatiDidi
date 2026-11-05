import { useState } from "react"

import type { IncomeEntry } from "@/features/survey/types"

export function IncomeBaselineForm({
  entries,
  setEntries,
}: {
  entries: IncomeEntry[]
  setEntries: (entries: IncomeEntry[]) => void
}) {
  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const [expanded, setExpanded] = useState(0)
  const updateEntry = (index: number, patch: Partial<IncomeEntry>) =>
    setEntries(
      entries.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)),
    )
  const toggleMonth = (index: number, month: string) => {
    const current = entries[index].months
    updateEntry(index, {
      months: current.includes(month)
        ? current.filter((item) => item !== month)
        : [...current, month],
    })
  }
  const gross = entries.reduce((sum, entry) => sum + entry.gross, 0)
  const cost = entries.reduce((sum, entry) => sum + entry.cost, 0)
  const net = gross - cost
  const activeSources = entries.filter((entry) => entry.gross > 0).length
  const incomeMonths = new Set(entries.flatMap((entry) => (entry.gross > 0 ? entry.months : [])))
    .size
  return (
    <div className="section-form income-section">
      <p className="section-help">
        प्रत्येक आय स्रोत खोलकर महीने और वार्षिक राशि भरें। शुद्ध आय स्वतः निकलेगी।
      </p>
      <div className="expandable-list">
        {entries.map((entry, index) => (
          <div className={`expandable-card ${expanded === index ? "open" : ""}`} key={entry.name}>
            <button
              className="expandable-head"
              onClick={() => setExpanded(expanded === index ? -1 : index)}
            >
              <span className={`source-dot ${entry.gross > 0 ? "active" : ""}`} />
              <strong>{entry.name}</strong>
              <span>
                {entry.gross > 0
                  ? `शुद्ध ₹${(entry.gross - entry.cost).toLocaleString("en-IN")}`
                  : "आय नहीं"}
              </span>
              <b>{expanded === index ? "−" : "+"}</b>
            </button>
            {expanded === index && (
              <div className="expandable-body">
                <span className="field-caption">आय वाले महीने</span>
                <div className="month-chips">
                  {monthLabels.map((month) => (
                    <button
                      key={month}
                      className={entry.months.includes(month) ? "selected" : ""}
                      onClick={() => toggleMonth(index, month)}
                    >
                      {month}
                    </button>
                  ))}
                </div>
                <div className="money-grid">
                  <label>
                    <span>सकल आय ₹</span>
                    <input
                      type="number"
                      value={entry.gross}
                      onChange={(event) =>
                        updateEntry(index, {
                          gross: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    <span>लागत ₹</span>
                    <input
                      type="number"
                      value={entry.cost}
                      onChange={(event) => updateEntry(index, { cost: Number(event.target.value) })}
                    />
                  </label>
                  <label className="auto-money">
                    <span>शुद्ध आय ₹</span>
                    <input readOnly value={(entry.gross - entry.cost).toLocaleString("en-IN")} />
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="income-totals">
        <div>
          <span>कुल सकल</span>
          <strong>₹{gross.toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <span>कुल लागत</span>
          <strong>₹{cost.toLocaleString("en-IN")}</strong>
        </div>
        <div className="net-total">
          <span>कुल वार्षिक शुद्ध आय</span>
          <strong>₹{net.toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <span>₹5000+ आय वाले महीने</span>
          <strong>{incomeMonths}/12</strong>
        </div>
      </div>
      <div className="income-meter detailed">
        <div>
          <span>लखपति मीटर</span>
          <strong>₹{net.toLocaleString("en-IN")} / ₹1,00,000</strong>
        </div>
        <div className="meter-scale">
          <i style={{ width: `${Math.min(net / 1000, 100)}%` }} />
          <b className="threshold-mark">
            <small>₹80K</small>
          </b>
          <b className="lakhpati-mark">
            <small>₹1L</small>
          </b>
        </div>
        <div className="meter-labels">
          <span>₹0</span>
          <span>थ्रेशोल्ड</span>
          <span>लखपति</span>
        </div>
        <div className="source-count">
          <strong>सक्रिय आय स्रोत: {activeSources}</strong>
          {activeSources < 2 && (
            <span className="status amber">एकल आय स्रोत – दूसरा स्रोत जोड़ें</span>
          )}
        </div>
      </div>
    </div>
  )
}
