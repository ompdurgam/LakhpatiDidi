import { useTr } from "@/i18n/tr"

import { num, pct } from "../format"
import type { Overview } from "../useOverview"

/** Surveyors (CRPs) in the area and how much of the PLD list is surveyed. */
export function SurveyorCoverage({ data }: { data: Overview }) {
  const tr = useTr()
  const { pld, surveyed } = data.totals
  const coverage = pct(surveyed, pld)
  return (
    <div className="card crp-mapping">
      <div className="card-head">
        <div>
          <h3>{tr("CRP और सर्वे कवरेज")}</h3>
          <p>{tr("सक्रिय सर्वेयर और सर्वेक्षित PLD")}</p>
        </div>
      </div>
      <div className="crp-big-stats">
        <div>
          <strong>{num(data.surveyors.length)}</strong>
          <span>{tr("सक्रिय CRP")}</span>
        </div>
        <div>
          <strong>{coverage}%</strong>
          <span>{tr("PLD सर्वेक्षित")}</span>
        </div>
      </div>
      <i>
        <b style={{ width: `${coverage}%` }} />
      </i>
      <p>{tr("शेष {{n}} PLD का सर्वे बाकी", { n: num(pld - surveyed) })}</p>
    </div>
  )
}

const STAGES = [
  "C1 आय ऑडिट",
  "C2 50% जाँच",
  "C3 DMMU नामांकन",
  "C4 SMMU सत्यापन",
  "C5 सार्वजनिक सम्मान",
]

/**
 * Lakhpati Gram certification. Only C2 (villages past the 50% mark) can be
 * computed today; the other stages are not recorded in the system yet.
 */
export function CertificationPipeline({ candidates }: { candidates: number }) {
  const tr = useTr()
  return (
    <div className="card certification district-certification">
      <span className="eyebrow">{tr("लखपति ग्राम")}</span>
      <h3>{tr("प्रमाणन पाइपलाइन")}</h3>
      {STAGES.map((stage, index) => (
        <div key={stage}>
          <i className={index === 1 && candidates ? "active" : ""}>{index + 1}</i>
          <span>{tr(stage)}</span>
          <b>{index === 1 ? `${num(candidates)} ${tr("गाँव")}` : "—"}</b>
        </div>
      ))}
      <p className="empty-note">{tr("C1, C3–C5 चरण अभी सिस्टम में दर्ज नहीं होते")}</p>
    </div>
  )
}

/** Each active surveyor's assigned Didis and submitted / draft surveys. */
export function SurveyorTable({ rows }: { rows: Overview["surveyors"] }) {
  const tr = useTr()
  return (
    <div className="card surveyor-performance">
      <div className="card-head">
        <div>
          <h3>{tr("सर्वेयर प्रदर्शन")}</h3>
          <p>{tr("निर्धारित दीदी और जमा सर्वे")}</p>
        </div>
      </div>
      {rows.length ? (
        <div className="surveyor-table">
          <div className="head">
            <span>{tr("सर्वेयर")}</span>
            <b>{tr("निर्धारित")}</b>
            <b>{tr("पूर्ण")}</b>
            <b>{tr("ड्राफ्ट")}</b>
            <b>{tr("कवरेज")}</b>
          </div>
          {rows.map((row) => (
            <div key={row.name}>
              <span>{row.name}</span>
              <b>{num(row.assigned)}</b>
              <b>{num(row.submitted)}</b>
              <b>{num(row.drafts)}</b>
              <em>{pct(row.submitted, row.assigned)}%</em>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-note">{tr("इस क्षेत्र में कोई सक्रिय सर्वेयर नहीं")}</p>
      )}
    </div>
  )
}
