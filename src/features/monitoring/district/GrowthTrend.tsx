import { useState } from "react"

import i18n from "@/i18n"
import { useTr } from "@/i18n/tr"

import { money, num, pct } from "../format"
import type { Trend, TrendPoint } from "./useTrend"

type Measure = {
  key: keyof Omit<TrendPoint, "month">
  title: string
  note: string
  format: (n: number) => string
  /** Average month instead of a quarter total in the headline (incomes). */
  average?: boolean
}

const MEASURES: Measure[] = [
  { key: "surveyed", title: "सर्वे पूरे", note: "हर माह सर्वेक्षित दीदी", format: num },
  { key: "received", title: "आवेदन प्राप्त", note: "विभागों को भेजे गए DPR", format: num },
  { key: "sanctioned", title: "आवेदन स्वीकृत", note: "स्वीकृति तिथि के माह में", format: num },
  {
    key: "sanctionedAmount",
    title: "स्वीकृत राशि",
    note: "अभिसरण से स्वीकृत ₹",
    format: money,
  },
  { key: "delivered", title: "लाभ वितरित", note: "संपत्ति / लाभ दीदी तक पहुँचा", format: num },
  { key: "gapsClosed", title: "हकदारी गैप बंद", note: "पात्र दीदी को लाभ मिला", format: num },
  {
    key: "incomeReporters",
    title: "मासिक आय दर्ज",
    note: "माह में आय दर्ज करने वाली दीदी",
    format: num,
  },
  {
    key: "avgMonthlyIncome",
    title: "औसत मासिक आय",
    note: "आय दर्ज करने वाली दीदी की औसत",
    format: money,
    average: true,
  },
]

const monthLabel = (month: string, long = false) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString(i18n.language === "en" ? "en-IN" : "hi-IN", {
    month: "short",
    ...(long ? { year: "numeric" } : {}),
  })

/** Last three months against the three before them (sum, or average for incomes). */
function quarterChange(values: number[], average = false) {
  const recent = values.slice(-3)
  const earlier = values.slice(-6, -3)
  const total = (xs: number[]) => {
    const used = average ? xs.filter((x) => x > 0) : xs
    const sum = used.reduce((a, b) => a + b, 0)
    return average ? (used.length ? sum / used.length : 0) : sum
  }
  const now = total(recent)
  const before = total(earlier)
  return { now, before, change: before ? Math.round(((now - before) / before) * 100) : null }
}

function MonthBars({ measure, months }: { measure: Measure; months: TrendPoint[] }) {
  const tr = useTr()
  const [hover, setHover] = useState<number | null>(null)
  const values = months.map((m) => m[measure.key])
  const max = Math.max(...values, 0)
  const { now, change } = quarterChange(values, measure.average)
  const shown = hover === null ? null : months[hover]
  return (
    <div className="card trend-card">
      <div className="trend-card-head">
        <div>
          <h4>{tr(measure.title)}</h4>
          <small>{tr(measure.note)}</small>
        </div>
        <div className="trend-headline">
          {shown ? (
            <>
              <strong>{measure.format(shown[measure.key])}</strong>
              <small>{monthLabel(shown.month, true)}</small>
            </>
          ) : (
            <>
              <strong>{measure.format(now)}</strong>
              <small>
                {tr(measure.average ? "पिछले 3 माह औसत" : "पिछले 3 माह")}
                {change !== null && (
                  <em className={change >= 0 ? "up" : "down"}>
                    {change >= 0 ? " ▲ " : " ▼ "}
                    {Math.abs(change)}%
                  </em>
                )}
              </small>
            </>
          )}
        </div>
      </div>
      {max ? (
        <div className="trend-bars" onMouseLeave={() => setHover(null)}>
          {months.map((m, i) => (
            <button
              key={m.month}
              type="button"
              className={hover === i ? "active" : ""}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${monthLabel(m.month, true)}: ${measure.format(values[i])}`}
            >
              <b style={{ height: `${Math.max(pct(values[i], max), values[i] ? 3 : 0)}%` }} />
              <span>{i % 2 === months.length % 2 ? "" : monthLabel(m.month)}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="empty-note">{tr("इस अवधि में कोई गतिविधि नहीं")}</p>
      )}
    </div>
  )
}

/** Month-by-month growth of the area over the last year, one small chart per measure. */
export function GrowthTrend({ trend, households }: { trend: Trend; households: number }) {
  const tr = useTr()
  const { months, before } = trend
  const surveyedInYear = months.reduce((s, m) => s + m.surveyed, 0)
  const sanctionedInYear = months.reduce((s, m) => s + m.sanctioned, 0)
  const startCoverage = pct(before.surveyed, households)
  const endCoverage = pct(before.surveyed + surveyedInYear, households)
  return (
    <>
      <section className="trend-summary">
        <div className="card">
          <span>{tr("सर्वे कवरेज वृद्धि (12 माह)")}</span>
          <strong>
            {startCoverage}% → {endCoverage}%
          </strong>
          <small>{tr("{{n}} नए सर्वे", { n: num(surveyedInYear) })}</small>
        </div>
        <div className="card">
          <span>{tr("स्वीकृत आवेदन (12 माह)")}</span>
          <strong>{num(sanctionedInYear)}</strong>
          <small>{tr("पहले से {{n}} स्वीकृत", { n: num(before.sanctioned) })}</small>
        </div>
        <div className="card">
          <span>{tr("स्वीकृत राशि (12 माह)")}</span>
          <strong>{money(months.reduce((s, m) => s + m.sanctionedAmount, 0))}</strong>
          <small>{tr("अभिसरण से")}</small>
        </div>
        <div className="card">
          <span>{tr("गैप पहचाने / बंद (12 माह)")}</span>
          <strong>
            {num(months.reduce((s, m) => s + m.gapsIdentified, 0))} /{" "}
            {num(months.reduce((s, m) => s + m.gapsClosed, 0))}
          </strong>
          <small>{tr("हकदारी गैप")}</small>
        </div>
      </section>
      <section className="trend-grid">
        {MEASURES.map((m) => (
          <MonthBars key={m.key} measure={m} months={months} />
        ))}
      </section>
    </>
  )
}
