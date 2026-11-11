import { useState } from "react"

import type { ApplicationRow } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

const OPEN = new Set(["submitted", "under_review", "info_requested"])

/**
 * BLCC agenda: the block's applications still awaiting a decision, overdue
 * first. Meeting mode steps through them; each opens in the application
 * drawer, where the decision is recorded.
 */
export function Blcc({
  rows,
  onSelect,
}: {
  rows: ApplicationRow[]
  onSelect: (row: ApplicationRow) => void
}) {
  const tr = useTr()
  const [meetingMode, setMeetingMode] = useState(false)
  const [current, setCurrent] = useState(0)
  const agenda = rows
    .filter((r) => OPEN.has(r.statusCode))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.days - a.days)
  const overdue = agenda.filter((r) => r.overdue).length

  if (meetingMode && agenda.length) {
    const index = Math.min(current, agenda.length - 1)
    const item = agenda[index]
    return (
      <section className="blcc-meeting-mode">
        <div className="meeting-mode-head">
          <div>
            <span className="eyebrow">{tr("BLCC बैठक मोड")}</span>
            <h2>
              {tr("लंबित मद")} {index + 1} / {agenda.length}
            </h2>
            <p>{tr("हर आवेदन खोलकर निर्णय दर्ज करें")}</p>
          </div>
          <button className="secondary" onClick={() => setMeetingMode(false)}>
            <Icon name="close" size={15} /> {tr("बैठक बंद करें")}
          </button>
        </div>
        <div className="meeting-progress">
          <i>
            <b style={{ width: `${((index + 1) / agenda.length) * 100}%` }} />
          </i>
        </div>
        <div className="card current-demand">
          <div className="demand-id">
            <span>{item.id}</span>
            <span className={`status ${item.overdue ? "red" : "amber"}`}>{item.status}</span>
          </div>
          <h3>{item.name}</h3>
          <p>
            {item.scheme} • {item.village}
          </p>
          <dl>
            <div>
              <dt>{tr("परियोजना लागत")}</dt>
              <dd>{item.amount}</dd>
            </div>
            <div>
              <dt>{tr("अनुदान")}</dt>
              <dd>{item.subsidy}</dd>
            </div>
            <div>
              <dt>{tr("विभाग")}</dt>
              <dd>{item.dept}</dd>
            </div>
            <div>
              <dt>{tr("प्राप्त")}</dt>
              <dd>{item.received}</dd>
            </div>
            <div>
              <dt>{tr("लंबित दिन")}</dt>
              <dd>{item.days}</dd>
            </div>
          </dl>
          <div className="meeting-decision-buttons">
            <button className="complete" onClick={() => onSelect(item)}>
              <Icon name="file" size={15} /> {tr("आवेदन खोलें")}
            </button>
            <button disabled={index === 0} onClick={() => setCurrent(index - 1)}>
              {tr("पिछला")}
            </button>
            <button disabled={index === agenda.length - 1} onClick={() => setCurrent(index + 1)}>
              {tr("अगला")} <Icon name="arrow" size={15} />
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="card blcc-card enhanced">
      <div className="meeting-banner">
        <div>
          <span>
            <Icon name="building" />
          </span>
          <div>
            <h3>{tr("BLCC बैठक मोड")}</h3>
            <p>{tr("निर्णय के लिए लंबित आवेदनों पर क्रमवार कार्यवाही करें")}</p>
          </div>
        </div>
        <button
          className="primary"
          disabled={!agenda.length}
          onClick={() => {
            setCurrent(0)
            setMeetingMode(true)
          }}
        >
          {tr("बैठक शुरू करें")} <Icon name="arrow" size={17} />
        </button>
      </div>
      <div className="register-head">
        <div>
          <h3>{tr("BLCC कार्यसूची")}</h3>
          <span>{tr("{{n}} लंबित आवेदन • {{o}} अतिदेय", { n: agenda.length, o: overdue })}</span>
        </div>
      </div>
      {agenda.length ? (
        <div className="blcc-table-scroll">
          <table className="blcc-register-table">
            <thead>
              <tr>
                {[
                  "आवेदन",
                  "दीदी",
                  "गाँव",
                  "योजना",
                  "विभाग",
                  "लागत",
                  "प्राप्त",
                  "लंबित दिन",
                  "स्थिति",
                ].map((label) => (
                  <th key={label}>{tr(label)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agenda.map((row) => (
                <tr key={row.id} onClick={() => onSelect(row)}>
                  <td>
                    <b className="app-id">{row.id}</b>
                  </td>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.village}</td>
                  <td>{row.scheme}</td>
                  <td>{row.dept}</td>
                  <td>{row.amount}</td>
                  <td>{row.received}</td>
                  <td>{row.days}</td>
                  <td>
                    <span className={`status ${row.overdue ? "red" : "amber"}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-note">{tr("निर्णय के लिए कोई आवेदन लंबित नहीं")}</p>
      )}
    </section>
  )
}
