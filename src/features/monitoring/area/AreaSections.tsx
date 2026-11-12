import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { PldDownload } from "@/features/households/PldDownload"
import { useTr } from "@/i18n/tr"

import { money, num, pct } from "../format"
import type { ChildArea, Overview } from "../useOverview"

const CHILD_LABEL: Record<string, string> = {
  district: "जिला",
  block: "ब्लॉक",
  gram_panchayat: "ग्राम पंचायत",
}

type SortKey = "name" | "households" | "surveyed" | "coverage" | "lakhpati" | "lakhpatiPct"

const value = (c: ChildArea, key: SortKey) =>
  key === "name"
    ? c.name
    : key === "coverage"
      ? pct(c.surveyed, c.households)
      : key === "lakhpatiPct"
        ? pct(c.lakhpati, c.surveyed)
        : c[key]

/** Every district (state) or block (district) with its survey and Lakhpati figures. */
export function ChildAreaTable({ data }: { data: Overview }) {
  const tr = useTr()
  const [sort, setSort] = useState<SortKey>("households")
  const rows = [...data.children].sort((a, b) => {
    const x = value(a, sort)
    const y = value(b, sort)
    return typeof x === "string" ? x.localeCompare(String(y)) : Number(y) - Number(x)
  })
  const head = (key: SortKey, label: string) => (
    <th>
      <button className={`sort-head ${sort === key ? "active" : ""}`} onClick={() => setSort(key)}>
        {tr(label)}
        {sort === key && " ▾"}
      </button>
    </th>
  )
  return (
    <section className="card department-leaderboard">
      <div className="card-head">
        <div>
          <h3>{tr("क्षेत्र-वार प्रगति")}</h3>
          <p>
            {num(rows.length)} {tr(CHILD_LABEL[data.area.childLevel] ?? "क्षेत्र")} •{" "}
            {tr("शीर्षक पर क्लिक कर क्रम बदलें")}
          </p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {head("name", CHILD_LABEL[data.area.childLevel] ?? "क्षेत्र")}
              {head("households", "रिकॉर्ड में दीदी")}
              <th>PLD</th>
              {head("surveyed", "सर्वेक्षित")}
              {head("coverage", "सर्वे कवरेज")}
              {head("lakhpati", "लखपति")}
              {head("lakhpatiPct", "लखपति %")}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td>{num(c.households)}</td>
                <td>{num(c.pld)}</td>
                <td>{num(c.surveyed)}</td>
                <td>{pct(c.surveyed, c.households)}%</td>
                <td>{num(c.lakhpati)}</td>
                <td>{c.surveyed ? `${pct(c.lakhpati, c.surveyed)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** CSV of the child areas' coverage (Excel opens it; the BOM keeps Hindi readable). */
function downloadCoverage(data: Overview) {
  const header = ["LGD code", "Area", "Didis", "PLD", "Surveyed", "Coverage %", "Lakhpati"]
  const rows = data.children.map((c) => [
    c.code,
    c.name,
    c.households,
    c.pld,
    c.surveyed,
    pct(c.surveyed, c.households),
    c.lakhpati,
  ])
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n")
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }))
  Object.assign(document.createElement("a"), {
    href: url,
    download: `coverage-${data.area.code}.csv`,
  }).click()
  URL.revokeObjectURL(url)
}

/** The area's report: live summary to print, and downloads. */
export function AreaReports({ data }: { data: Overview }) {
  const tr = useTr()
  const { totals, funnel, gaps } = data
  const lines: [string, string][] = [
    [
      "सर्वे कवरेज",
      tr("{{n}} / {{t}} दीदी • {{p}}%", {
        n: num(totals.surveyed),
        t: num(totals.households),
        p: pct(totals.surveyed, totals.households),
      }),
    ],
    [
      "लखपति",
      tr("{{n}} दीदी • सर्वेक्षित का {{p}}%", {
        n: num(totals.lakhpati),
        p: pct(totals.lakhpati, totals.surveyed),
      }),
    ],
    [
      "आवेदन",
      tr("{{a}} भेजे • {{s}} स्वीकृत • {{d}} वितरित • {{o}} अतिदेय", {
        a: num(funnel.applications),
        s: num(funnel.sanctionedApplications),
        d: num(funnel.deliveredApplications),
        o: num(funnel.overdue),
      }),
    ],
    ["अभिसरण राशि", money(funnel.sanctionedAmount)],
    ["हकदारी गैप", tr("{{o}} खुले • {{c}} बंद", { o: num(gaps.open), c: num(gaps.closed) })],
  ]
  return (
    <div className="block-reports">
      <section className="card monthly-report-builder print-root">
        <div className="report-builder-head">
          <div>
            <span className="eyebrow">
              {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </span>
            <h3>{tr("{{area}} मासिक सारांश", { area: data.area.name })}</h3>
            <p>{tr("लाइव डेटा से स्वतः भरा गया")}</p>
          </div>
        </div>
        <div className="auto-report-sections">
          {lines.map(([title, summary]) => (
            <div key={title}>
              <span>
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>{tr(title)}</strong>
                <small>{summary}</small>
              </div>
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
              <strong>{tr("PLD सूची")}</strong>
              <small>{tr("हर दीदी • सर्वे और आय स्थिति सहित")}</small>
            </div>
            <PldDownload />
          </article>
          <article className="card">
            <span>
              <Icon name="file" size={20} />
            </span>
            <div>
              <strong>{tr("क्षेत्र-वार कवरेज")}</strong>
              <small>{tr("{{n}} क्षेत्र", { n: num(data.children.length) })}</small>
            </div>
            <em>CSV</em>
            <button onClick={() => downloadCoverage(data)}>
              <Icon name="download" size={15} />
            </button>
          </article>
        </div>
      </section>
    </div>
  )
}
