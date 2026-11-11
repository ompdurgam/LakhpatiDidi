import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { SurveyorTable } from "./area/Pipeline"
import type { BlockSection } from "./BlockDashboard"
import { num, pct } from "./format"
import type { Overview } from "./useOverview"
import { Task } from "./widgets/Task"

/** Lower half of the block overview: GP coverage, deadlines, pendency and surveyors. */
export function BlockOverviewLower({
  data,
  go,
}: {
  data: Overview
  go: (section: BlockSection) => void
}) {
  const tr = useTr()
  // Gram panchayats with the most Didis on record first.
  const gps = [...data.children].sort((a, b) => b.households - a.households).slice(0, 6)
  const { funnel, deadlines } = data
  const tasks = funnel.overdue + deadlines.dueSoon + deadlines.awaitingDelivery
  return (
    <>
      <section className="bottom-grid">
        <div className="card coverage-card">
          <div className="card-head">
            <div>
              <h3>{tr("ग्राम पंचायत-वार सर्वे कवरेज")}</h3>
              <p>{tr("रिकॉर्ड की PLD के विरुद्ध पूर्ण सर्वे")}</p>
            </div>
          </div>
          {gps.map((gp) => (
            <div className="coverage-row" key={gp.code}>
              <div>
                <strong>{gp.name}</strong>
                <span>
                  {num(gp.surveyed)} / {num(gp.pld)}
                </span>
              </div>
              <div className="progress-line">
                <i style={{ width: `${pct(gp.surveyed, gp.pld)}%` }} />
              </div>
              <b>{pct(gp.surveyed, gp.pld)}%</b>
            </div>
          ))}
        </div>
        <div className="card deadline-card">
          <div className="card-head">
            <div>
              <h3>{tr("SLA और जरूरी कार्य")}</h3>
              <p>{tr("समय सीमा के करीब और अतिदेय")}</p>
            </div>
            <span className="count-badge">{tasks}</span>
          </div>
          {tasks === 0 && <p className="empty-note">{tr("अभी कोई लंबित कार्य नहीं")}</p>}
          {funnel.overdue > 0 && (
            <Task
              color="red"
              icon="alert"
              title={tr("{{n}} आवेदन स्वीकृति में अतिदेय", { n: funnel.overdue })}
              sub="SLA समय सीमा पार"
              action="अभी देखें"
              onClick={() => go("applications")}
            />
          )}
          {deadlines.dueSoon > 0 && (
            <Task
              color="amber"
              icon="clock"
              title={tr("{{n}} आवेदन 3 दिन में देय", { n: deadlines.dueSoon })}
              sub="SLA समय सीमा करीब"
              action="देखें"
              onClick={() => go("applications")}
            />
          )}
          {deadlines.awaitingDelivery > 0 && (
            <Task
              color="blue"
              icon="file"
              title={tr("{{n}} स्वीकृत आवेदन डिलीवरी के इंतज़ार में", {
                n: deadlines.awaitingDelivery,
              })}
              sub="स्वीकृति के बाद डिलीवरी बाकी"
              action="देखें"
              onClick={() => go("applications")}
            />
          )}
        </div>
      </section>
      <section className="overview-operations-grid">
        <div className="card department-pendency">
          <div className="card-head">
            <div>
              <h3>{tr("विभागीय लंबितता")}</h3>
              <p>{tr("प्राप्त / लंबित / अतिदेय आवेदन")}</p>
            </div>
            <button className="text-button" onClick={() => go("applications")}>
              {tr("आवेदन देखें")} <Icon name="arrow" size={14} />
            </button>
          </div>
          {data.departments.length ? (
            <div className="pendency-table">
              <div className="head">
                <span>{tr("विभाग")}</span>
                <b>{tr("प्राप्त")}</b>
                <b>{tr("लंबित")}</b>
                <b>{tr("अतिदेय")}</b>
              </div>
              {data.departments.map((dept) => (
                <div key={dept.code}>
                  <span>{dept.name}</span>
                  <b>{num(dept.received)}</b>
                  <b className="pending">{num(dept.pending)}</b>
                  <b className="overdue">{num(dept.overdue)}</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-note">{tr("अभी तक किसी विभाग को आवेदन नहीं भेजा गया")}</p>
          )}
        </div>
        <SurveyorTable rows={data.surveyors} />
      </section>
    </>
  )
}
