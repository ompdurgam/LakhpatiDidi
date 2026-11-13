import { useMemo } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"

import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { Kpi } from "@/components/ui/Kpi"
import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { SchemeConvergence } from "@/features/block/SchemeConvergence"
import { useTr } from "@/i18n/tr"

import { CandidateVillages, Escalations } from "../area/AreaLists"
import { AreaMapCard } from "../area/AreaMapCard"
import { AreaReports, ChildAreaTable } from "../area/AreaSections"
import { DepartmentLeaderboard, DepartmentMatrix } from "../area/DepartmentTables"
import { FinancialSupport, GapHeatmap } from "../area/GapsAndLoans"
import { IncomeBands, SectorDonut } from "../area/IncomeCharts"
import { CertificationPipeline, SurveyorCoverage, SurveyorTable } from "../area/Pipeline"
import { StatewideFunnel } from "../area/StatewideFunnel"
import { money, num, pct } from "../format"
import { type Overview, useOverview } from "../useOverview"
import { compareWithState } from "./compare"
import { DistrictComparison } from "./DistrictComparison"
import { DistrictHealth } from "./DistrictHealth"
import { GrowthTrend } from "./GrowthTrend"
import { useTrend } from "./useTrend"

const TABS = [
  ["summary", "सारांश"],
  ["growth", "वृद्धि"],
  ["blocks", "ब्लॉक"],
  ["departments", "विभाग व योजनाएँ"],
  ["livelihoods", "आजीविका व आय"],
  ["certification", "लखपति ग्राम"],
  ["escalations", "एस्केलेशन"],
  ["team", "सर्वे टीम"],
  ["reports", "रिपोर्ट"],
] as const
type Tab = (typeof TABS)[number][0]

/** Everything about one district, for the state team (/state/districts/:districtId). */
export function DistrictProfile() {
  const tr = useTr()
  const navigate = useNavigate()
  const { districtId = "" } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find(([key]) => key === params.get("tab"))?.[0] ?? "summary") as Tab
  const area = useMemo(() => ({ level: "district" as const, code: districtId }), [districtId])
  const { data, isLoading, error } = useOverview(area, 50)
  const state = useOverview()
  if (isLoading) return <PageSkeleton />
  if (error || !data) return <EmptyState>{error?.message ?? tr("डेटा नहीं मिला")}</EmptyState>
  const districts = [...(state.data?.children ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  const comparison = state.data ? compareWithState(data, state.data) : []
  const lakhpatiRank = comparison.find((c) => c.key === "lakhpatiPct")
  const { totals, funnel } = data
  return (
    <div className="page role-page state-workspace district-profile">
      <Link to="/state/districts" className="back-link">
        <Icon name="arrow" size={14} className="flip" /> {tr("सभी जिले")}
      </Link>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">
            {tr("जिला प्रोफ़ाइल")} • LGD {data.area.code}
          </span>
          <h2>{data.area.name}</h2>
          <p>
            {num(data.children.length)} {tr("ब्लॉक")} • {num(totals.households)}{" "}
            {tr("दीदी रिकॉर्ड में")}
            {lakhpatiRank?.rank &&
              ` • ${tr("लखपति दर में {{r}} / {{n}} जिले", { r: lakhpatiRank.rank, n: lakhpatiRank.of })}`}
          </p>
        </div>
        {districts.length > 1 && (
          <div className="welcome-actions">
            <label className="workspace-select-label">
              <span>{tr("जिला")}</span>
              <select
                className="workspace-select"
                value={districtId}
                onChange={(e) => navigate(`/state/districts/${e.target.value}?tab=${tab}`)}
              >
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
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
          meta={tr("सर्वेक्षित PLD {{n}}%", { n: pct(totals.surveyed, totals.pld) })}
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
      <div className="admin-tabs district-tabs" role="tablist">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "active" : ""}
            onClick={() => setParams(key === "summary" ? {} : { tab: key }, { replace: true })}
          >
            {tr(label)}
          </button>
        ))}
      </div>
      <TabBody tab={tab} data={data} comparison={comparison} />
    </div>
  )
}

function TabBody({
  tab,
  data,
  comparison,
}: {
  tab: Tab
  data: Overview
  comparison: ReturnType<typeof compareWithState>
}) {
  const area = { level: "district" as const, code: data.area.code }
  switch (tab) {
    case "growth":
      return <DistrictGrowth data={data} />
    case "blocks":
      return (
        <>
          <section className="map-grid district-map-grid">
            <AreaMapCard data={data} role="state" />
          </section>
          <ChildAreaTable data={data} />
        </>
      )
    case "departments":
      return (
        <>
          <DepartmentLeaderboard rows={data.departments} />
          <DepartmentMatrix data={data} />
          <SchemeConvergence area={area} />
        </>
      )
    case "livelihoods":
      return (
        <>
          <section className="district-charts-grid">
            <SectorDonut rows={data.sectors} surveyed={data.totals.surveyed} />
            <IncomeBands bands={data.incomeBands} />
          </section>
          <section className="state-analysis-grid">
            <GapHeatmap data={data} />
            <FinancialSupport rows={data.loans} />
          </section>
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
    case "team":
      return (
        <section className="state-compliance-grid">
          <SurveyorTable rows={data.surveyors} />
          <SurveyorCoverage data={data} />
        </section>
      )
    case "reports":
      return <AreaReports data={data} pld={false} />
    default:
      return (
        <>
          <DistrictHealth data={data} />
          {comparison.length > 0 && <DistrictComparison rows={comparison} />}
          <section className="district-insights-grid">
            <StatewideFunnel data={data} />
            <Escalations rows={data.escalations.slice(0, 8)} />
          </section>
        </>
      )
  }
}

function DistrictGrowth({ data }: { data: Overview }) {
  const tr = useTr()
  const trend = useTrend({ level: "district", code: data.area.code })
  if (trend.isLoading) return <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>
  if (trend.error || !trend.data)
    return <EmptyState>{trend.error?.message ?? tr("डेटा नहीं मिला")}</EmptyState>
  return <GrowthTrend trend={trend.data} households={data.totals.households} />
}
