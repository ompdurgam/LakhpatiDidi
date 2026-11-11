import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { useUi } from "@/stores/ui"

import { type Tracker, useAddIncome } from "./useTracker"

const COLORS = ["crop", "ntfp", "wage", "fish"]

/** The last six months (YYYY-MM), oldest first. */
function lastSixMonths() {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
}

const monthLabel = (ym: string) =>
  new Date(`${ym}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" })

/** Monthly income register: six-month chart, entries, and adding this month's income. */
export function MonthlyIncome({ tracker }: { tracker: Tracker }) {
  const tr = useTr()
  const notify = useUi((s) => s.notify)
  const add = useAddIncome(tracker.profile.code)
  const [open, setOpen] = useState(false)
  const sourceNames = [
    ...new Set([...tracker.sources.map((s) => s.name), ...tracker.monthly.map((m) => m.source)]),
  ]
  const options = sourceNames.length ? [...sourceNames, "अन्य"] : ["खेती", "मजदूरी", "अन्य"]
  const [source, setSource] = useState(options[0])
  const [amount, setAmount] = useState("")
  const legend = sourceNames.slice(0, COLORS.length)
  const months = lastSixMonths().map((month) => {
    const entries = tracker.monthly.filter((m) => m.month === month)
    return { month, entries, total: entries.reduce((sum, e) => sum + e.amount, 0) }
  })
  const max = Math.max(1, ...months.map((m) => m.total))
  const save = async () => {
    try {
      const result = await add.mutateAsync({ source, amount: Number(amount) })
      notify(result.message)
      setAmount("")
      setOpen(false)
    } catch (e) {
      notify((e as Error).message)
    }
  }
  return (
    <section className="card monthly-income-register">
      <div className="tracker-section-head">
        <div>
          <h3>{tr("मासिक आय रजिस्टर")}</h3>
          <p>{tr("पिछले 6 माह • स्रोत अनुसार")}</p>
        </div>
        <div className="income-chart-legend">
          {legend.map((name, i) => (
            <span key={name}>
              <i className={COLORS[i]} />
              {tr(name)}
            </span>
          ))}
        </div>
      </div>
      {tracker.monthly.length ? (
        <>
          <div className="stacked-income-chart">
            {months.map((m) => (
              <div key={m.month} className="income-month-bar">
                <div className="bar-value">₹{Math.round(m.total / 1000)}K</div>
                <div className="stacked-bar">
                  {m.entries.map((e) => (
                    <i
                      key={e.source}
                      className={COLORS[legend.indexOf(e.source)] ?? "fish"}
                      style={{ height: `${(e.amount / max) * 100}%` }}
                    />
                  ))}
                </div>
                <span>{monthLabel(m.month)}</span>
              </div>
            ))}
          </div>
          <div className="income-log-table">
            <div className="head">
              <span>{tr("माह")}</span>
              <span>{tr("स्रोत")}</span>
              <span>{tr("राशि ₹")}</span>
            </div>
            {tracker.monthly.map((e) => (
              <div key={`${e.month}-${e.source}`}>
                <span>{monthLabel(e.month)}</span>
                <span>{tr(e.source)}</span>
                <strong>{e.amount.toLocaleString("en-IN")}</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="empty-note">{tr("अभी तक कोई मासिक आय दर्ज नहीं")}</p>
      )}
      {open && (
        <div className="add-income-inline">
          <label className="text-control">
            <span>{tr("स्रोत")}</span>
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              {options.map((option) => (
                <option key={option} value={option}>
                  {tr(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-control">
            <span>{tr("राशि ₹")}</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <button
            className="primary"
            disabled={add.isPending || !(Number(amount) > 0)}
            onClick={save}
          >
            {tr("सहेजें")}
          </button>
        </div>
      )}
      <button className="add-monthly-income" onClick={() => setOpen(!open)}>
        <Icon name={open ? "close" : "plus"} size={15} />
        {open ? tr("रद्द करें") : tr("इस माह की आय दर्ज करें")}
      </button>
    </section>
  )
}
