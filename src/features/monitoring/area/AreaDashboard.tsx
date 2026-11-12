import { useState } from "react"

import { EmptyState } from "@/components/ui/EmptyState"
import { Kpi } from "@/components/ui/Kpi"
import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { PldDownload } from "@/features/households/PldDownload"
import { useTr } from "@/i18n/tr"

import { AreaPicker, type PickedArea } from "../AreaPicker"
import { money, num, pct } from "../format"
import { type DashLevel, type Overview, useOverview } from "../useOverview"
import { CandidateVillages, Escalations } from "./AreaLists"
import { AreaMapCard } from "./AreaMapCard"
import { AreaReports, ChildAreaTable } from "./AreaSections"
import { DepartmentLeaderboard, DepartmentMatrix } from "./DepartmentTables"
import { FinancialSupport, GapHeatmap } from "./GapsAndLoans"
import { IncomeBands, SectorDonut } from "./IncomeCharts"
import { CertificationPipeline, SurveyorCoverage, SurveyorTable } from "./Pipeline"
import { StatewideFunnel } from "./StatewideFunnel"

const COPY = {
  district: { eyebrow: "DMMU • जिला मिशन", title: "{{name}} जिला अवलोकन", children: "ब्लॉक" },
  state: { eyebrow: "SMMU • राज्य मिशन", title: "{{name}} राज्य अवलोकन", children: "जिले" },
} as const

/** The pages under a district / state menu (the overview shows everything). */
export type AreaSection =
  "overview" | "areas" | "departments" | "certification" | "escalations" | "reports"

/** District / state dashboard, every figure computed from live data. */
export function AreaDashboard({
  level,
  section = "overview",
}: {
  level: Exclude<DashLevel, "block">
  section?: AreaSection
}) {
  const tr = useTr()
  const [picked, setPicked] = useState<PickedArea>()
  // The escalations page lists every overdue application, not just the top few.
  const { data, isLoading, error } = useOverview(picked, section === "escalations" ? 200 : 8)
  if (isLoading) return <PageSkeleton />
  if (error || !data) return <EmptyState>{error?.message ?? tr("डेटा नहीं मिला")}</EmptyState>
  const copy = COPY[level]
  const { totals, funnel } = data
  return (
    <div className={`page role-page ${level}-workspace`}>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">{tr(copy.eyebrow)}</span>
          <h2>{tr(copy.title, { name: data.area.name })}</h2>
          <p>
            {num(data.children.length)} {tr(copy.children)} • {num(totals.households)}{" "}
            {tr("दीदी रिकॉर्ड में")}
          </p>
        </div>
        <div className="welcome-actions">
          <AreaPicker data={data} onPick={setPicked} />
          <PldDownload />
        </div>
      </div>
      <section className="monitor-kpis">
        <Kpi
          icon="people"
          color="green"
          label="सर्वेक्षित दीदी"
          value={num(totals.surveyed)}
          meta={tr("रिकॉर्ड की {{n}}% दीदी", { n: pct(totals.surveyed, totals.households) })}
          progress={pct(totals.surveyed, totals.households)}
        />
        <Kpi
          icon="trend"
          color="saffron"
          label="PLD चिन्हित"
          value={num(totals.pld)}
          meta={tr("राज्य PLD सूची से")}
        />
        <Kpi
          icon="check"
          color="emerald"
          label="लखपति हासिल"
          value={num(totals.lakhpati)}
          meta={tr("सर्वेक्षित का {{n}}%", { n: pct(totals.lakhpati, totals.surveyed) })}
          progress={pct(totals.lakhpati, totals.surveyed)}
        />
        <Kpi
          icon="scheme"
          color="blue"
          label="अभिसरण राशि"
          value={money(funnel.sanctionedAmount)}
          meta={tr("{{n}} विभाग सक्रिय", { n: funnel.activeDepartments })}
        />
      </section>
      <SectionBody section={section} data={data} />
    </div>
  )
}

function SectionBody({ section, data }: { section: AreaSection; data: Overview }) {
  const totals = data.totals
  switch (section) {
    case "areas":
      return (
        <>
          <section className="map-grid district-map-grid">
            <AreaMapCard data={data} />
          </section>
          <ChildAreaTable data={data} />
        </>
      )
    case "departments":
      return (
        <>
          <DepartmentLeaderboard rows={data.departments} />
          <DepartmentMatrix data={data} />
        </>
      )
    case "certification":
      return (
        <section className="district-insights-grid">
          <CandidateVillages rows={data.candidates} />
          <CertificationPipeline candidates={data.candidates.length} />
        </section>
      )
    case "escalations":
      return <Escalations rows={data.escalations} />
    case "reports":
      return <AreaReports data={data} />
    default:
      return (
        <>
          <section className="map-grid district-map-grid">
            <AreaMapCard data={data} />
          </section>
          <section className="district-insights-grid">
            <StatewideFunnel data={data} />
            <Escalations rows={data.escalations} />
          </section>
          <DepartmentLeaderboard rows={data.departments} />
          <DepartmentMatrix data={data} />
          <section className="district-insights-grid">
            <CandidateVillages rows={data.candidates} />
            <CertificationPipeline candidates={data.candidates.length} />
          </section>
          <section className="district-charts-grid">
            <SectorDonut rows={data.sectors} surveyed={totals.surveyed} />
            <IncomeBands bands={data.incomeBands} />
          </section>
          <section className="state-analysis-grid">
            <GapHeatmap data={data} />
            <FinancialSupport rows={data.loans} />
          </section>
          <section className="state-compliance-grid">
            <SurveyorTable rows={data.surveyors} />
            <SurveyorCoverage data={data} />
          </section>
        </>
      )
  }
}
