import { useState } from "react"

import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import type { HouseholdRecord } from "@/features/households/types"
import { useSurveyHouseholds } from "@/features/survey/surveyHouseholds"
import { useTr } from "@/i18n/tr"

import { MonthlyIncome } from "./MonthlyIncome"
import { type Tracker, useTracker } from "./useTracker"

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`

/**
 * One Didi's journey from survey to Lakhpati. Opened from the register with a
 * household; on its own (the field income tab) it first asks which Didi.
 */
export function HouseholdTracker({
  desktop = false,
  household,
}: {
  desktop?: boolean
  household?: HouseholdRecord
}) {
  const tr = useTr()
  const [picked, setPicked] = useState<string>()
  const code = household?.id ?? picked
  const className = desktop ? "tracker-desktop" : "phone-content tracker"
  if (!code)
    return (
      <div className={className}>
        <TrackerPicker onPick={setPicked} />
      </div>
    )
  return (
    <div className={className}>
      {!household && (
        <button className="text-button" onClick={() => setPicked(undefined)}>
          {tr("← दूसरी दीदी चुनें")}
        </button>
      )}
      <TrackerBody code={code} />
    </div>
  )
}

/** Surveyed Didis in the user's area, searchable. */
function TrackerPicker({ onPick }: { onPick: (code: string) => void }) {
  const tr = useTr()
  const [q, setQ] = useState("")
  const { data, isLoading } = useSurveyHouseholds(q, "done", 0)
  return (
    <section className="card tracker-applications">
      <div className="tracker-section-head">
        <div>
          <h3>{tr("मासिक आय ट्रैकिंग")}</h3>
          <p>{tr("सर्वेक्षित दीदी चुनें")}</p>
        </div>
      </div>
      <label className="text-control">
        <input
          value={q}
          placeholder={tr("नाम, कोड या गाँव खोजें")}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {isLoading ? (
        <p className="empty-note">{tr("लोड हो रहा है…")}</p>
      ) : data?.items?.length ? (
        data.items.map((item) => (
          <button key={item.code} className="generic-row" onClick={() => onPick(item.code)}>
            <div>
              <strong>{item.name}</strong>
              <span>
                {item.code} • {item.village}
              </span>
            </div>
            <Icon name="chevron" size={16} />
          </button>
        ))
      ) : (
        <p className="empty-note">{tr("अभी तक कोई सर्वेक्षित दीदी नहीं")}</p>
      )}
    </section>
  )
}

function TrackerBody({ code }: { code: string }) {
  const tr = useTr()
  const { data, isLoading, error } = useTracker(code)
  if (isLoading) return <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>
  if (error || !data) return <EmptyState>{error?.message ?? tr("डेटा नहीं मिला")}</EmptyState>
  return (
    <>
      <Profile tracker={data} />
      <div className="tracker-grid">
        <IncomeStreams tracker={data} />
        <div className="card activity-log">
          <h3>{tr("हाल की गतिविधि")}</h3>
          {data.milestones.some((m) => m.date) ? (
            data.milestones
              .filter((m) => m.date)
              .reverse()
              .map((m) => (
                <p key={m.label}>
                  <i />
                  {tr(m.label)} <span>{m.date}</span>
                </p>
              ))
          ) : (
            <p className="empty-note">{tr("अभी कोई गतिविधि नहीं")}</p>
          )}
        </div>
      </div>
      <Applications tracker={data} />
      <Gaps tracker={data} />
      <MonthlyIncome tracker={data} />
    </>
  )
}

function Profile({ tracker: { profile, milestones } }: { tracker: Tracker }) {
  const tr = useTr()
  const reached = milestones.filter((m) => m.date).length
  return (
    <>
      <div className="tracker-profile">
        <div className="avatar large">{profile.initials}</div>
        <div>
          <h3>{profile.name}</h3>
          <p>
            {profile.code} • {profile.village}
          </p>
        </div>
        <span
          className={`status ${
            profile.income >= 100000 ? "green" : profile.income >= 80000 ? "amber" : "blue"
          }`}
        >
          {profile.surveyed ? profile.status : tr("सर्वे बाकी")}
        </span>
      </div>
      <div className="horizontal-timeline">
        {milestones.map((m, index) => (
          <div key={m.label} className={m.date ? "done" : index === reached ? "active" : ""}>
            <i>{m.date ? "✓" : index + 1}</i>
            <span>{tr(m.label)}</span>
            {m.date && <small>{m.date}</small>}
          </div>
        ))}
      </div>
    </>
  )
}

function IncomeStreams({ tracker }: { tracker: Tracker }) {
  const tr = useTr()
  const max = Math.max(1, ...tracker.sources.map((s) => s.amount))
  return (
    <div className="card income-streams">
      <h3>{tr("आय स्रोत")}</h3>
      {tracker.sources.length ? (
        tracker.sources.map((s) => (
          <div key={s.name}>
            <span>{tr(s.name)}</span>
            <i>
              <b style={{ width: `${(s.amount / max) * 100}%` }} />
            </i>
            <strong>{rupees(s.amount)}</strong>
          </div>
        ))
      ) : (
        <p className="empty-note">{tr("सर्वे के बाद आय स्रोत दिखेंगे")}</p>
      )}
    </div>
  )
}

function Applications({ tracker }: { tracker: Tracker }) {
  const tr = useTr()
  return (
    <section className="card tracker-applications">
      <div className="tracker-section-head">
        <div>
          <h3>{tr("आवेदन")}</h3>
          <p>{tr("विभाग को भेजे गए DPR")}</p>
        </div>
        <span>{tr("{{n}} आवेदन", { n: tracker.applications.length })}</span>
      </div>
      {tracker.applications.length ? (
        <div className="tracker-table-scroll">
          <table>
            <thead>
              <tr>
                <th>App ID</th>
                <th>{tr("योजना")}</th>
                <th>{tr("विभाग")}</th>
                <th>{tr("स्थिति")}</th>
                <th>{tr("लंबित")}</th>
              </tr>
            </thead>
            <tbody>
              {tracker.applications.map((a) => (
                <tr key={a.code}>
                  <td>
                    <b>{a.code}</b>
                  </td>
                  <td>{a.scheme}</td>
                  <td>{a.department}</td>
                  <td>
                    <span className={`status ${a.overdue ? "red" : "blue"}`}>{a.status}</span>
                  </td>
                  <td>{tr("{{n}} दिन", { n: a.days })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-note">{tr("अभी तक कोई आवेदन नहीं")}</p>
      )}
    </section>
  )
}

function Gaps({ tracker }: { tracker: Tracker }) {
  const tr = useTr()
  return (
    <section className="card tracker-entitlements">
      <div className="tracker-section-head">
        <div>
          <h3>{tr("हकदारी अंतर")}</h3>
          <p>{tr("लंबित और बंद मांगें")}</p>
        </div>
      </div>
      {tracker.gaps.length ? (
        tracker.gaps.map((g) => (
          <div key={g.scheme}>
            <span className={`gap-icon ${g.open ? "red" : "green"}`}>
              <Icon name={g.open ? "alert" : "check"} size={14} />
            </span>
            <p>
              <strong>{g.scheme}</strong>
              <small>
                {g.department} • {g.date}
              </small>
            </p>
            <span className={`status ${g.open ? "amber" : "green"}`}>
              {g.open ? tr("खुला") : tr("बंद ✔")}
            </span>
          </div>
        ))
      ) : (
        <p className="empty-note">{tr("कोई हकदारी गैप दर्ज नहीं")}</p>
      )}
    </section>
  )
}
