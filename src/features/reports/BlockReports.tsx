import type { ApplicationRow } from "@/api/types"
import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { num, pct } from "@/features/monitoring/format"
import { useOverview } from "@/features/monitoring/useOverview"
import { useTr } from "@/i18n/tr"

/** Downloads rows as a CSV file (Excel opens it; the BOM keeps Hindi readable). */
function downloadCsv(fileName: string, header: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }))
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName })
  link.click()
  URL.revokeObjectURL(url)
}

/** The block's monthly report, filled from live data, plus real exports. */
export function BlockReports({ rows }: { rows: ApplicationRow[] }) {
  const tr = useTr()
  const { data, isLoading, error } = useOverview()
  if (isLoading) return <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>
  if (error || !data) return <EmptyState>{error?.message ?? tr("डेटा नहीं मिला")}</EmptyState>
  const { totals, funnel } = data
  const month = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  const sections: [string, string][] = [
    [
      "कवरेज",
      tr("{{n}} परिवार सर्वेक्षित • {{p}}%", {
        n: num(totals.surveyed),
        p: pct(totals.surveyed, totals.pld),
      }),
    ],
    [
      "फनल",
      tr("{{d}} DPR • {{s}} स्वीकृत", {
        d: num(funnel.applications),
        s: num(funnel.sanctionedApplications),
      }),
    ],
    [
      "आय बैंड",
      tr("{{l}} लखपति • {{t}} थ्रेशोल्ड", { l: num(totals.lakhpati), t: num(totals.threshold) }),
    ],
    [
      "हकदारी गैप",
      tr("{{o}} खुले • {{c}} बंद", { o: num(data.gaps.open), c: num(data.gaps.closed) }),
    ],
    ["एस्केलेशन", tr("{{n}} अतिदेय आवेदन", { n: num(funnel.overdue) })],
  ]
  return (
    <div className="block-reports">
      <section className="card monthly-report-builder print-root">
        <div className="report-builder-head">
          <div>
            <span className="eyebrow">{month}</span>
            <h3>{tr("{{block}} ब्लॉक मासिक सारांश", { block: data.area.name })}</h3>
            <p>{tr("लाइव डेटा से स्वतः भरा गया")}</p>
          </div>
        </div>
        <div className="auto-report-sections">
          {sections.map(([title, summary]) => (
            <div key={title}>
              <span>
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>{tr(title)}</strong>
                <small>{summary}</small>
              </div>
              <em>{tr("स्वतः भरा")}</em>
            </div>
          ))}
        </div>
        <div className="report-submit-row">
          <span />
          <button className="primary" onClick={() => window.print()}>
            <Icon name="download" size={15} /> {tr("प्रिंट / PDF")}
          </button>
        </div>
      </section>
      <section className="report-downloads">
        <h3>{tr("डाउनलोड")}</h3>
        <div>
          <article className="card">
            <span>
              <Icon name="file" size={20} />
            </span>
            <div>
              <strong>{tr("आवेदन सूची")}</strong>
              <small>{tr("{{n}} आवेदन • स्थिति सहित", { n: num(rows.length) })}</small>
            </div>
            <em>CSV</em>
            <button
              disabled={!rows.length}
              onClick={() =>
                downloadCsv(
                  "applications.csv",
                  ["ID", "Didi", "Village", "Scheme", "Department", "Amount", "Received", "Status"],
                  rows.map((r) => [
                    r.id,
                    r.name,
                    r.village,
                    r.scheme,
                    r.dept,
                    r.amount,
                    r.received,
                    r.status,
                  ]),
                )
              }
            >
              <Icon name="download" size={15} />
            </button>
          </article>
          <article className="card">
            <span>
              <Icon name="file" size={20} />
            </span>
            <div>
              <strong>{tr("ग्राम पंचायत-वार कवरेज")}</strong>
              <small>{tr("{{n}} ग्राम पंचायत", { n: num(data.children.length) })}</small>
            </div>
            <em>CSV</em>
            <button
              onClick={() =>
                downloadCsv(
                  "gp-coverage.csv",
                  ["LGD code", "Gram panchayat", "Didis", "PLD", "Surveyed", "Lakhpati"],
                  data.children.map((c) => [
                    c.code,
                    c.name,
                    c.households,
                    c.pld,
                    c.surveyed,
                    c.lakhpati,
                  ]),
                )
              }
            >
              <Icon name="download" size={15} />
            </button>
          </article>
        </div>
      </section>
    </div>
  )
}
