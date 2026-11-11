import { useEffect, useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { useSession } from "@/stores/session"

import { DidiWorklist } from "./DidiWorklist"
import { type SurveyStatusFilter, useSurveyHouseholds } from "./surveyHouseholds"

export function SurveyHome({
  setScreen,
  onOpenSurvey,
}: {
  setScreen: (screen: string) => void
  /** Opens the survey: a Didi on record by HH code, or a blank one for a new Didi. */
  onOpenSurvey: (code?: string) => void
}) {
  const tr = useTr()
  const userName = useSession((s) => s.user?.name ?? "")
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<SurveyStatusFilter>("pending")
  const [page, setPage] = useState(0)
  // Search once typing pauses; a new search or filter starts from page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim())
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])
  const list = useSurveyHouseholds(search, status, page)
  const stats = list.data
  return (
    <div className="phone-content survey-home">
      <div className="offline-banner">
        <Icon name="alert" size={15} />
        <span>{tr("ऑफलाइन मोड • डेटा फोन में सुरक्षित है")}</span>
      </div>
      <div className="mobile-greeting">
        <small>{tr("नमस्ते, {{name}}", { name: userName })}</small>
        <h3>{tr("आज का फील्ड कार्य")}</h3>
        <p>
          {tr("{{n}} दीदी का सर्वे बाकी है", { n: (stats?.pending ?? 0).toLocaleString("en-IN") })}
        </p>
      </div>
      <div className="mobile-stats three">
        <div>
          <strong>{(stats?.total ?? 0).toLocaleString("en-IN")}</strong>
          <span>{tr("कुल दीदी")}</span>
        </div>
        <div className="warn">
          <strong>{(stats?.pending ?? 0).toLocaleString("en-IN")}</strong>
          <span>{tr("सर्वे बाकी")}</span>
        </div>
        <div>
          <strong>{(stats?.done ?? 0).toLocaleString("en-IN")}</strong>
          <span>{tr("पूर्ण")}</span>
        </div>
      </div>
      <button className="start-survey" onClick={() => onOpenSurvey()}>
        <Icon name="plus" /> {tr("नई दीदी का सर्वे शुरू करें")}
      </button>
      <button className="village-profile-card" onClick={() => setScreen("village")}>
        <span>
          <Icon name="building" size={19} />
        </span>
        <div>
          <strong>{tr("ग्राम प्रोफ़ाइल – बड़ांजी")}</strong>
          <small>{tr("अंतिम अपडेट: 12 नवंबर 2026")}</small>
          <i>
            <b />
          </i>
        </div>
        <em>{tr("{{n}}% पूर्ण", { n: 70 })}</em>
        <Icon name="chevron" size={16} />
      </button>
      <button className="monthly-income-card">
        <span>
          <Icon name="trend" size={19} />
        </span>
        <div>
          <strong>{tr("मासिक आय दर्ज करें")}</strong>
          <small>{tr("12 PLD बाकी • नवंबर 2026")}</small>
        </div>
        <Icon name="chevron" size={16} />
      </button>
      <DidiWorklist
        data={list.data}
        loading={list.isFetching}
        query={query}
        setQuery={setQuery}
        status={status}
        setStatus={(next) => {
          setStatus(next)
          setPage(0)
        }}
        page={page}
        setPage={setPage}
        onOpen={onOpenSurvey}
      />
      <button className="sync-card">
        <Icon name="trend" />
        <div>
          <strong>{tr("अभी सिंक करें")}</strong>
          <span>{tr("अंतिम सिंक: आज, 08:34")}</span>
        </div>
        <b>4</b>
      </button>
    </div>
  )
}
