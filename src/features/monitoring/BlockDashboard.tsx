import { useState } from "react"

import type { ApplicationRow, User } from "@/api/types"
import { Legend } from "@/components/charts/Legend"
import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { Kpi } from "@/components/ui/Kpi"
import { ApplicationTable } from "@/features/applications/ApplicationTable"
import { PldDownload } from "@/features/households/PldDownload"
import { useTr } from "@/i18n/tr"

import { AreaPicker, type PickedArea } from "./AreaPicker"
import { BlockOverviewLower } from "./BlockOverviewLower"
import { donutGradient, num, pct } from "./format"
import { useOverview } from "./useOverview"
import { OverviewStat } from "./widgets/OverviewStat"

export type BlockSection = "households" | "applications" | "blcc" | "reports"

const FUNNEL_COLORS = ["green", "sage", "saffron", "blue", "emerald", "teal", "deep"]

/** Block overview, every figure computed from live data for the user's block. */
export function BlockDashboard({
  user,
  rows,
  onSelect,
  go,
}: {
  user: User
  rows: ApplicationRow[]
  onSelect: (item: ApplicationRow) => void
  go: (section: BlockSection) => void
}) {
  const tr = useTr()
  const [picked, setPicked] = useState<PickedArea>()
  const { data, isLoading, error } = useOverview(picked)
  if (isLoading) return <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>
  if (error || !data) return <EmptyState>{error?.message ?? tr("डेटा नहीं मिला")}</EmptyState>
  const { totals, funnel, gaps } = data
  const stages: [string, number][] = [
    ["सर्वे पूरा", totals.surveyed],
    ["योजना सुझाव", funnel.asked],
    ["योजना सहमति", funnel.interested],
    ["DPR भेजा", funnel.dpr],
    ["स्वीकृत", funnel.sanctioned],
    ["आय सक्रिय", funnel.incomeActive],
    ["लखपति", totals.lakhpati],
  ]
  const inProgress = totals.surveyed - totals.lakhpati - totals.threshold
  return (
    <div className="page">
      <section className="welcome">
        <div>
          <h2>
            {tr("नमस्ते")}, {tr(user.name).split(" ")[0]} {tr("जी")} <span>—</span>
          </h2>
          <p>{tr("आज तक {{block}} ब्लॉक की प्रगति यहाँ है।", { block: data.area.name })}</p>
        </div>
        <div className="welcome-actions">
          <AreaPicker data={data} onPick={setPicked} />
          <PldDownload />
          <button className="primary" onClick={() => go("blcc")}>
            <Icon name="plus" size={17} /> {tr("BLCC बैठक मोड")}
          </button>
        </div>
      </section>
      <section className="kpi-grid">
        <Kpi
          icon="people"
          color="green"
          label="सर्वेक्षित परिवार"
          value={num(totals.surveyed)}
          meta={tr("{{n}} PLD का {{p}}%", {
            n: num(totals.pld),
            p: pct(totals.surveyed, totals.pld),
          })}
          progress={pct(totals.surveyed, totals.pld)}
        />
        <Kpi
          icon="trend"
          color="saffron"
          label="पहचानी गई PLD"
          value={num(totals.pld)}
          meta={tr("राज्य PLD सूची से")}
        />
        <Kpi
          icon="file"
          color="blue"
          label="DPR विभाग को भेजे"
          value={num(funnel.applications)}
          meta={tr("{{n}}% PLD कवरेज", { n: pct(funnel.dpr, totals.pld) })}
        />
        <Kpi
          icon="check"
          color="emerald"
          label="लखपति दीदी"
          value={num(totals.lakhpati)}
          meta={tr("सर्वेक्षित का {{n}}%", { n: pct(totals.lakhpati, totals.surveyed) })}
          progress={pct(totals.lakhpati, totals.surveyed)}
        />
      </section>
      <section className="overview-secondary-kpis">
        <OverviewStat
          icon="alert"
          tone="red"
          label="हकदारी गैप"
          value={tr("{{n}} खुले", { n: num(gaps.open) })}
          meta={tr("{{n}} बंद", { n: num(gaps.closed) })}
        />
        <OverviewStat
          icon="check"
          tone="green"
          label="वितरित"
          value={num(funnel.deliveredApplications)}
          meta={tr("{{n}}% स्वीकृत आवेदन", {
            n: pct(funnel.deliveredApplications, funnel.sanctionedApplications),
          })}
        />
        <OverviewStat
          icon="trend"
          tone="blue"
          label="मासिक आय अपडेट"
          value={`${pct(totals.monthlyUpdated, funnel.incomeActive)}%`}
          meta={tr("इस माह {{n}} परिवार", { n: num(totals.monthlyUpdated) })}
          progress={pct(totals.monthlyUpdated, funnel.incomeActive)}
        />
      </section>
      <section className="content-grid">
        <div className="card progress-card">
          <div className="card-head">
            <div>
              <h3>{tr("लखपति यात्रा")}</h3>
              <p>{tr("सर्वे से आय उपलब्धि तक परिवारों की स्थिति")}</p>
            </div>
          </div>
          {totals.surveyed === 0 && (
            <p className="empty-note">{tr("अभी तक कोई सर्वे जमा नहीं हुआ है")}</p>
          )}
          <div className="funnel">
            {stages.map(([label, value], index) => (
              <div className="funnel-row" key={label}>
                <span>{tr(label)}</span>
                <div className="funnel-track">
                  <i
                    className={FUNNEL_COLORS[index]}
                    style={{ width: `${Math.max(pct(value, stages[0][1]), value ? 4 : 0)}%` }}
                  >
                    <b>{num(value)}</b>
                  </i>
                </div>
              </div>
            ))}
          </div>
          <div className="funnel-note">
            <Icon name="trend" size={19} />
            <div>
              <strong>
                {tr("{{n}}% सर्वेक्षित परिवार लखपति बने", {
                  n: pct(totals.lakhpati, totals.surveyed),
                })}
              </strong>
              <span>
                {tr("औसत वार्षिक आय {{amount}}", { amount: `₹${num(totals.avgIncome)}` })}
              </span>
            </div>
          </div>
        </div>
        <div className="card income-card">
          <div className="card-head">
            <div>
              <h3>{tr("आय स्थिति")}</h3>
              <p>{tr("सर्वेक्षित परिवारों का वार्षिक आय स्तर")}</p>
            </div>
          </div>
          <div className="donut-wrap">
            <div
              className="donut"
              style={{
                background: donutGradient([
                  { value: totals.lakhpati, color: "#287349" },
                  { value: totals.threshold, color: "#e6a51c" },
                  { value: Math.max(0, inProgress), color: "#7da6a0" },
                ]),
              }}
            >
              <div>
                <strong>{num(totals.surveyed)}</strong>
                <span>{tr("सर्वेक्षित")}</span>
              </div>
            </div>
            <div className="legend">
              <Legend color="#287349" value={num(totals.lakhpati)} label="लखपति (₹1 लाख+)" />
              <Legend color="#e6a51c" value={num(totals.threshold)} label="थ्रेशोल्ड (₹80K+)" />
              <Legend color="#7da6a0" value={num(Math.max(0, inProgress))} label="प्रगति पर" />
            </div>
          </div>
          {totals.singleSource > 0 && (
            <div className="alert-strip">
              <Icon name="alert" size={19} />
              <div>
                <strong>{tr("{{n}} सिंगल-स्ट्रीम PLD", { n: num(totals.singleSource) })}</strong>
                <span>{tr("आय का दूसरा स्रोत जोड़ना जरूरी है")}</span>
              </div>
              <button onClick={() => go("households")}>{tr("देखें")}</button>
            </div>
          )}
        </div>
      </section>
      <section className="card applications-card">
        <div className="card-head">
          <div>
            <h3>{tr("हाल के आवेदन")}</h3>
            <p>{tr("विभागीय कार्यवाही के लिए भेजे गए DPR")}</p>
          </div>
          <div className="table-actions">
            <button className="text-button" onClick={() => go("applications")}>
              {tr("सभी आवेदन")} <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
        <ApplicationTable rows={rows} onSelect={onSelect} />
      </section>
      <BlockOverviewLower data={data} go={go} />
    </div>
  )
}
